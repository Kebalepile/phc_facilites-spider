import { toJson } from "../pipline/healthEstablishmentPipline.js";

export class HealthEstablishmentsSpider {
  constructor(browser) {
    this.name = "Health Establlishment";
    this.page = null;
    this.browser = browser;
    this.allowedDomains = [
      "https://www.healthestablishments.org.za/Home/Facility",
    ];
    this.data = [];
  }
  async startSpider() {
    try {
      if (!this.page) {
        await this.setPage();
      }
      console.log(`${this.name} spider, has began crawling for data.`);

      await this.provincesData();

      if (this.data.length) {
        toJson(this.data);
        console.log(
          `${this.name} spider finished crawling check for data in relevant files.`
        );
        return;
      }
      console.log("No data scraped !!!");
    } catch (error) {
      console.log(error);
    }
  }
  async setPage() {
    this.page = await this.browser.newPage();
  }

  /**
   * @description scrape all the province's relative names.
   */

  async provincesData() {
    try {
      await this.page.goto(this.allowedDomains[0]);
      await this.page.waitForSelector("body");
      let provinceOptions = await this.page.$$eval(
        "#province option",
        (options) =>
          options
            .map((option) => ({
              value: option.value,
              text: option.textContent,
            }))
            .filter((data) => data.value !== "0")
      );

      for (let provinceOption of provinceOptions) {
        let completeProvinceData = await this.privinceDistrictsData(
          provinceOption
        );
        this.data.push(completeProvinceData);
      }
    } catch (error) {
      console.log(error);
    } finally {
      this.browser.close();
    }
  }

  /**
   *
   * @param {object} option
   * @returns province data object with province name and districts found in province.
   */

  async privinceDistrictsData(option) {
    try {
      let selectElement = await this.page.waitForSelector("#province");

      await selectElement.select(option.value);
      await selectElement.dispose();
      await this.page.waitForTimeout(5000);

      let districtOptions = await this.page.$$eval(
        "#district option",
        (options) =>
          options
            .map((option) => ({
              value: option.value,
              text: option.textContent,
            }))
            .filter((data) => !["0", "-1"].includes(data.value))
      );

      let completeProvinceData = {
        province: option.text,
        districts: {
          totalDistricts: districtOptions.length,
          districtNames: districtOptions.map((data) => data.text),
          districtFacilities: {
            numberOfHealthFacilites: 0,
            healthFacilities: {},
          },
        },
      };
      for (let districtOption of districtOptions) {
        let districtHealthFacilities = await this.healthCareFacilities(
          districtOption
        );

        completeProvinceData.districts.districtFacilities.healthFacilities[districtOption.text] = {
          total:districtHealthFacilities.length,
          districtHealthFacilities
        };
        completeProvinceData.districts.districtFacilities.numberOfHealthFacilites += districtHealthFacilities.length;
      }
      console.log(completeProvinceData);
      return completeProvinceData;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @description scrapes Primary Health Care facilities data in respective district.
   */

  async healthCareFacilities(district) {
    
    try {
      let selectElement = await this.page.waitForSelector("#district");

      await selectElement.select(district.value);

      await selectElement.dispose();

      await this.page.waitForTimeout(5000);

      await this.page.click("#btnLoadMap");

      await this.page.waitForTimeout(10000);
      let districtHealthFacilities = await this.page.evaluate(() => {
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
          return info;
        };
        
        let dataList = [];
        let imageElements = document.querySelectorAll(".leaflet-marker-icon");
        for (let imageElement of imageElements) {
          imageElement.click();
          let facilityData = facilityInfo();
          dataList.push(facilityData);
        }

        return dataList;
      });

     
      return await districtHealthFacilities;
    } catch (error) {
      console.log(error);
    }
  }
}
