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

      if(this.data.length){
     
          toJson(this.data);
          console.log(
            `${this.name} spider finished crawling check for data in relevant files.`
          );
          return;
        
      }
      console.log("No data scraped !!!")
    } catch (error) {
      consle.log(error);
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
      let provinceOptions = await this.page.$$eval("#province option", (options) =>
        options
          .map((option) => ({ value: option.value, text: option.textContent }))
          .filter((data) => data.value !== "0")
      );

     
      for (let provinceOption of provinceOptions){
        let districtInfo = await this.privinceDistrictsData(provinceOption);
        this.data.push( districtInfo)
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
      let selectElement = await this.page.$("#province");

      await selectElement.select(option.value);
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

      let districtFacilities = {
        numberOfHealthFacilities: 0,
        healthFacilities: [],
      };

      for (let districtOption of districtOptions) {
        let districtHealthFacilites = await this.healthCareFacilities(districtOption);

        districtFacilities.healthFacilities = districtHealthFacilites;
        districtFacilities.numberOfHealthFacilities = districtHealthFacilites?.length;
      }
      console.log(districtFacilities);
      return {
        province: option.text,
        districts: {
          total: districtOptions.length,
          names: districtOptions.map((data) => data.text),
          districtFacilities,
        },
      };
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @description scrapes Primary Health Care facilities data in respective district.
   */

  async healthCareFacilities(district) {
    try {
      let selectElement = await this.page.$("#district");

      await selectElement.select(district.value);
      // Wait for the effects to take place
      await this.page.waitForTimeout(5000); // Adjust the timeout as needed

      let [button] = await this.page.$x('//*[@id="btnLoadMap"]');
      if (button) {
        button.click();
        await this.page.waitForTimeout(5000);

        let images = await this.page.$$(
          "img.leaflet-marker-icon.leaflet-zoom-animated.leaflet-interactive"
        );

        let districtFacilities = [];

        for (let image of images) {
          await this.page.waitForTimeout(6000);
          await image.click();

          await this.page.waitForTimeout(6000);

          let facilityData = await this.facilityDetails();

          console.log(facilityData);

          districtFacilities.push(facilityData);

          let closeButton = await this.page.$(
            'button.btn.btn-primary[data-dismiss="modal"]'
          );
          await this.page.waitForTimeout(6000);
          if (closeButton) {
            
            await closeButton.click();
            await this.page.waitForTimeout(6000);
          }
        }
        return districtFacilities;
      }
    } catch (error) {
      console.log(error);
    }
  }

  async facilityDetails() {
    let facilityInfo = {};

    try {
      let element = await this.page.$("#facilityAccordion");
      let cardElements = await element.$$(".card");

      for (let cardElement of cardElements) {
        let cardHeader = await cardElement.$(".card-header");
        let headingText = await cardHeader.$$eval(
          ".accordionHeading",
          (elements) => elements[0].textContent.trim()
        );
        let cardBody = await cardElement.$(".card-body");
        let tableRows = await cardBody.$$("tbody tr");
        let rowData = {};

        for (let row of tableRows) {
          let cells = await row.$$("th, td");

          if (cells.length === 2) {
            let [keyCell, valueCell] = cells;
            let key = await keyCell.evaluate((element) =>
              element.textContent.trim()
            );
            let value = await valueCell.evaluate((element) =>
              element.textContent.trim()
            );

            rowData[key] = value;
          }
        }

        facilityInfo[headingText] = rowData;
      }

      return facilityInfo;
    } catch (error) {
      console.log(error);
    }
  }
}
