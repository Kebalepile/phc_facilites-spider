import json
import time
from selenium import webdriver

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class Health_Facilities_Spider:
    name = "health facilities spider"

    def __init__(self):
        self.allowed_domains = [
            "https://www.healthestablishments.org.za/Home/Facility"]
        options = webdriver.ChromeOptions()
        options.add_argument("--headless")
        self.driver = webdriver.Chrome()
        self.data = []

    async def run(self):
        print(f"{self.name} has begun crawling for data.")
        self.driver.get(self.allowed_domains[0])
        tab_title = "Primary Health Care facilities - Primary Health Care Facility"
        assert tab_title in self.driver.title
        await self.province_data()
        self.driver.quit()

    def save_to_database(self, file_name="data"):
        if len(self.data) > 0:
            with open(f"database/{file_name}.json", "w") as file:
                json.dump(self.data, file, indent=4)
            print("Data saved in the database folder.")
        else:
            print("No data scraped.")

    async def province_data(self):
        wait = WebDriverWait(self.driver, 50)

        selector = wait.until(
            EC.presence_of_element_located((By.ID, "province")))

        options = selector.find_elements(By.TAG_NAME, "option")

        options = [{"text": option.text, "value": option.get_attribute(
            "value")} for option in options if option.get_attribute("value") != "0"]

        for option in options:
            data = await self.province_districts(selector, option)
            self.data.append({
                "province": option["text"],
                "districts": {"total": len(data["district_names"]),
                              "district_names": data["district_names"]},
                "health_facilities": data["district_health_facilities"]})
            self.save_to_database(option["text"])

        self.save_to_database()

    async def province_districts(self, province_selector, province_option):
        district_names = []
        district_health_facilities = {
            "total": 0,
            "facilities": {}
        }

        select_element = Select(province_selector)

        select_element.select_by_value(province_option['value'])

        wait = WebDriverWait(self.driver, 50)

        district_selector = wait.until(
            EC.presence_of_element_located((By.ID, "district")))

        
        options_found = wait.until(lambda _: len(self.driver.find_elements(By.CSS_SELECTOR,'#district option')) > 1)
        # -----------------------------------------------
        print("Options found : ",options_found)
        # -----------------------------------------------
        district_options = []

        if options_found:

            district_options = self.driver.find_elements(By.CSS_SELECTOR,'#district option')
           

        district_select = Select(district_selector)

        for option in district_options:
            text = option.text.strip()
            value = option.get_attribute("value")

            if int(value) not in [0, -1]:
                print(f"{text} Health Facilities: ")

                district_names.append(text)

                district_select.select_by_value(value)
                self.driver.execute_script(
                    f"arguments[0].value='{value}';", district_selector)

                health_facilities = await self.district_health_facilities(text)

                district_health_facilities["facilities"][text] = health_facilities

                district_health_facilities["total"] += len(health_facilities)

        return {
            "district_names": district_names,
            "district_health_facilities": district_health_facilities
        }

    async def district_health_facilities(self, district_name):
        health_facilities = []
        load_map_button = self.driver.find_element(By.ID, "btnLoadMap")
        
        self.driver.execute_script("arguments[0].click()", load_map_button)

        wait = WebDriverWait(self.driver, 50)

        map_label = wait.until(EC.presence_of_element_located((By.ID,"item_description")))

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

        info = self.driver.execute_script("""
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

        # ==============================
        print(info)
        # ==============================
        time.sleep(6)


        return info