import { launch } from "puppeteer";

async function crawler() {
  const browser = await launch({ headless: false });

  const spider = new PHC_SPIDER(browser);
  await spider.provincesData();
}

crawler();

class PHC_SPIDER {
  constructor(browser) {
    this.page = null;
    this.browser = browser;
    this.allowedDomains = [
      "https://www.healthestablishments.org.za/Home/Facility",
    ];
    this.data = [];
  }
  async setPage() {
    this.page = await this.browser.newPage();
  }

  /**
   * @description scrape all the province's relative names.
   */

  async provincesData() {
    try {
      if (!this.page) {
        await this.setPage();
      }
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
          console.log("done");
          console.log(this.data);
        } else {
          console.log(await value);
          this.data.push(await value);
        }
      }
    } catch (error) {
      console.log(error);
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
    const selectElement = await this.page.$("#province");

    await selectElement.select(optionData.value);
    // Wait for the effects to take place
    await this.page.waitForTimeout(10000); // Adjust the timeout as needed
    const districtData = await this.page.$$eval("#district option", (options) =>
      options
        .map((option) => ({
          value: option.value,
          text: option.textContent,
        }))
        .filter((data) => !["0", "-1"].includes(data.value))
    );
    // console.log(optionData.text);
    // console.log("Selected option: ", districtData);
    return {
      province: optionData.text,
      districts: {
        total: districtData.length,
        names: districtData.map((data) => data.text),
      },
    };
  }
}
