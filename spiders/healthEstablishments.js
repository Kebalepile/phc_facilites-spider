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
      this.provincesData();
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
      // console.log("Getting province data.");

      await this.page.goto(this.allowedDomains[0]);
      await this.page.waitForSelector("body");
      let optionValues = await this.page.$$eval("#province option", (options) =>
        options
          .map((option) => ({ value: option.value, text: option.textContent }))
          .filter((data) => data.value !== "0")
      );

      let iterator = this.destrictDataGenerator(optionValues);
      for (let i = 0; i <= optionValues.length; i++) {
        let { done, value } = iterator.next();
        if (done) {
          toJson(this.data);
          console.log(
            `${this.name} spider finished crawling check for data in relevant files.`
          );
        } else {
          this.data.push(await value);
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      this.browser.close();
    }
  }

  /**
   * @param {array} optionValues
   * @description Iterators over array of optionValue objects.
   */

  *destrictDataGenerator(optionValues) {
    for (let optionValue of optionValues) {
      yield this.privinceDistrictsData(optionValue);
    }
  }

  /**
   *
   * @param {object} optionData
   * @returns province data object with province name and districts found in province.
   */

  async privinceDistrictsData(optionData) {
    // console.log("Getting districts data of respective province.");

    const selectElement = await this.page.$("#province");

    await selectElement.select(optionData.value);
    // Wait for the effects to take place
    await this.page.waitForTimeout(5000); // Adjust the timeout as needed
    const districtData = await this.page.$$eval("#district option", (options) =>
      options
        .map((option) => ({
          value: option.value,
          text: option.textContent,
        }))
        .filter((data) => !["0", "-1"].includes(data.value))
    );

    const districtIterator = this.healthCareFacilitiesGenerator([
      ...new Set(districtData),
    ]);

    let districtFacilities = {
      numberOfHealthFacilities: 0,
      primaryHealthFacilities: [],
    };

    for (let i = 0; i < districtData.length; i++) {
      let { done, value } = districtIterator.next();
      console.log(await value);
      if (done) {
        let dataList = await value;
        districtFacilities.primaryHealthFacilities = dataList;
        districtFacilities.numberOfHealthFacilities = dataList?.length;
      }
    }
    console.log(districtFacilities);
    return {
      province: optionData.text,
      districts: {
        total: districtData.length,
        names: districtData.map((data) => data.text),
        districtFacilities,
      },
    };
  }

  /**
   * @description scrapes Primary Health Care facilities data in respective district.
   */

  async healthCareFacilities(district) {
    // console.log("Getting health care facilities data of respective district.");

    const selectElement = await this.page.$("#district");

    await selectElement.select(district.value);
    // Wait for the effects to take place
    await this.page.waitForTimeout(5000); // Adjust the timeout as needed
    // =====
    const [button] = await this.page.$x('//*[@id="btnLoadMap"]');
    if (button) {
      button.click();
      await this.page.waitForTimeout(5000);

      const images = await this.page.$$(
        "img.leaflet-marker-icon.leaflet-zoom-animated.leaflet-interactive"
      );

      const distrctFacilities = [];

      for (const image of images) {
          await this.page.waitForTimeout(10000);
        await image.click();
        await this.page.waitForTimeout(10000);

        const facilityData = await this.facilityDetails();

        console.log(facilityData);
        distrctFacilities.push(facilityData);
        const closeButton = await this.page.$(
          'button.btn.btn-primary[data-dismiss="modal"]'
        );
        if (closeButton) {
          await this.page.waitForTimeout(10000);
          await closeButton.click();
        }
        await this.page.waitForTimeout(10000);
      }
      return distrctFacilities;
    }
    // ====
  }
  *healthCareFacilitiesGenerator(districtOptions) {
    for (let districtOption of districtOptions) {
      yield this.healthCareFacilities(districtOption);
    }
  }
  async facilityDetails() {
    // console.log("Getting facility information");
    const facilityInfo = {};

    try {
      const element = await this.page.$("#facilityAccordion");
      const cardElements = await element.$$(".card");

      for (let cardElement of cardElements) {
        const cardHeader = await cardElement.$(".card-header");
        const headingText = await cardHeader.$$eval(
          ".accordionHeading",
          (elements) => elements[0].textContent.trim()
        );
        const cardBody = await cardElement.$(".card-body");
        const tableRows = await cardBody.$$("tbody tr");
        const rowData = {};

        for (let row of tableRows) {
          const cells = await row.$$("th, td");

          if (cells.length === 2) {
            const [keyCell, valueCell] = cells;
            const key = await keyCell.evaluate((element) =>
              element.textContent.trim()
            );
            const value = await valueCell.evaluate((element) =>
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
