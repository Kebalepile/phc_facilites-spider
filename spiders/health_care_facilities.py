import re
import time
import json
import os.path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import StaleElementReferenceException


class Health_Facilities_Spider:
    name = "health facilities spider"

    def __init__(self):
        self.allowed_domains = [
            "https://www.healthestablishments.org.za/Home/Facility"]
        options = webdriver.ChromeOptions()
        options.add_argument("--headless")
        self.driver = webdriver.Chrome(options=options)
        self.data = []
        self.province_option_values = []
        self.province_names = []

    async def run(self):

        print(f"{self.name} has begun crawling for data.")

        file_path = os.path.join('database', 'data.json')

        if os.path.isfile(file_path):
            with open(file_path, 'r') as f:
                f_data = json.load(f)
                if isinstance(f_data, list) and len(f_data) > 0:
                    self.data.extend(f_data)
                    for province in f_data:
                        self.province_names.append(province["province"])

        self.driver.get(self.allowed_domains[0])
        tab_title = "Primary Health Care facilities - Primary Health Care Facility"

        assert tab_title in self.driver.title
        await self.province_data()
        self.driver.quit()

    async def province_data(self):
        try:
            wait = WebDriverWait(self.driver, 50)

            selector = wait.until(
                EC.presence_of_element_located((By.ID, "province")))

            options = selector.find_elements(By.TAG_NAME, "option")

            options = [{"text": option.text, "value": option.get_attribute(
                "value")} for option in options if option.get_attribute("value") != "0"]

            if len(self.province_names) > 0:
                options = [option for option in options if option["text"]
                           not in self.province_names]

            if len(self.province_option_values) > 0:
                last_option = self.province_option_values[-1]
                index = next((index for index, option in enumerate(
                    options) if option["value"] == last_option["value"]), None)
                if index is not None:
                    options = options[index:]

            if len(options) == 0:
                print("All data scrapped.")
                return
            
            for option in options:
                self.province_option_values.append(option)
                data = await self.province_districts(selector, option)
                self.data.append({
                    "province": option["text"],
                    "districts": {"total": len(data["district_names"]),
                                  "district_names": data["district_names"]},
                    "health_facilities": data["district_health_facilities"]})
                await self.save_to_database()


        except StaleElementReferenceException:
            self.driver.refresh()
            await self.run()

    async def province_districts(self, province_selector, province_option):
        district_names = []
        district_health_facilities = {
            "total": 0,
            "facilities": {}
        }

        try:
            select_element = Select(province_selector)

            select_element.select_by_value(province_option['value'])

            wait = WebDriverWait(self.driver, 50)

            district_selector = wait.until(
                EC.presence_of_element_located((By.ID, "district")))

            options_found = wait.until(lambda _: len(
                self.driver.find_elements(By.CSS_SELECTOR, '#district option')) > 1)
            # -----------------------------------------------
            print("Options found : ", options_found)
            # -----------------------------------------------
            district_options = []

            if options_found:

                district_options = self.driver.find_elements(
                    By.CSS_SELECTOR, '#district option')

            district_select = Select(district_selector)

            for option in district_options:
                text = option.text.strip()
                value = option.get_attribute("value")

                if int(value) not in [0, -1]:
                    print(f" \n {text} Health Facilities: \n")

                    district_names.append(text)

                    district_select.select_by_value(value)
                    self.driver.execute_script(
                        f"arguments[0].value='{value}';", district_selector)

                    health_facilities = await self.district_health_facilities(text)

                    district_health_facilities["facilities"][text.replace(
                        " ", "_")] = health_facilities

                    district_health_facilities["total"] += len(
                        health_facilities)

            return {
                "district_names": district_names,
                "district_health_facilities": district_health_facilities
            }
        except StaleElementReferenceException:
            self.driver.refresh()
            await self.run()

    async def district_health_facilities(self, district_name):
        health_facilities = []
        load_map_button = self.driver.find_element(By.ID, "btnLoadMap")

        self.driver.execute_script("arguments[0].click()", load_map_button)

        wait = WebDriverWait(self.driver, 50)

        map_label = wait.until(
            EC.presence_of_element_located((By.ID, "item_description")))

        assert district_name in map_label.text

        map_points = wait.until(EC.presence_of_all_elements_located(
            (By.CLASS_NAME, "leaflet-marker-icon")))

        if len(map_points):
            for map_point in map_points:
                self.driver.execute_script("arguments[0].click();", map_point)
                info = await self.facility_info()
                health_facilities.append(info)

        return health_facilities

    async def facility_info(self):
        time.sleep(6)
        wait = WebDriverWait(self.driver, 50)

        wait.until(EC.presence_of_element_located(
            (By.ID, "facilityAccordion")))

        raw_info = self.driver.execute_script("""
            const facilityInfo = () => {
            let info = {};
            let element = document.querySelector("#facilityAccordion");
            let cardElements = element.querySelectorAll(".card");

            for (let cardElement of cardElements) {
                let cardHeader = cardElement.querySelector(".card-header");
                let headingText = cardHeader
                    .querySelector(".accordionHeading")
                    .textContent.trim();
                let cardBody = cardElement.querySelector(".card-body");
                let tableRows = cardBody.querySelectorAll("tbody tr");
                let rowData = {};

                for (let row of tableRows) {
                    let cells = row.querySelectorAll("th, td");

                    if (cells.length === 2) {
                        let [keyCell, valueCell] = cells;
                        let key = keyCell.textContent.trim();
                        let value = valueCell.textContent.trim();

                        rowData[key] = value;
                    }
                }

                info[headingText] = rowData;
            }


            const closeButton = document.querySelector('.modal-header button[data-dismiss="modal"]');
            closeButton.click();

            return info;
            };

            return facilityInfo();
        """)

        dialog_background = self.driver.find_element(
            By.XPATH, './/div[contains(@class, "modal-header")]//button[@data-dismiss="modal"]')

        self.driver.execute_script("arguments[0].click()", dialog_background)
        info = await self.refine_data(raw_info)
        # ==============================
        print(info)
        # ==============================
        time.sleep(6)

        return info

    async def refine_data(self, raw_info):
        processed_data = {}
        for key, value in raw_info.items():
            key = re.sub(r'[ ,/]', '_', key)

            if isinstance(value, dict):
                processed_data[key] = await self.refine_data(value)
            else:
                lowercase_key = key.lower()

                if lowercase_key == "latitude" or lowercase_key == "longitude":
                    processed_data[key] = value

                else:
                    try:
                        processed_data[key] = int(value)
                    except ValueError:
                        processed_data[key] = value
        return processed_data

    async def save_to_database(self, file_name="data"):
        if len(self.data) > 0:

            with open(f"database/{file_name}.json", "w") as file:
                json.dump(self.data, file, indent=4)
            print("Data saved in the database folder.")
        else:
            print("No data scraped.")
