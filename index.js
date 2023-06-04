import { Builder, Browser, By, Key, until } from "selenium-webdriver";

import repl from "repl";

async function startRepl() {
  let driver = await new Builder().forBrowser("firefox").build();
  // let replServer = repl.start({prompt: '> '});
  // replServer.context.driver = driver;
  // replServer.context.By = By;
  // replServer.context.Key = Key;
  // replServer.context.until = until;
  const spider = new PHC_SPIDER(driver);
  spider.provinces();
}

startRepl();

class PHC_SPIDER {
  constructor(driver) {
    this.driver = driver;
    this.allowedDomains = [
      "https://www.healthestablishments.org.za/Home/Facility",
    ];
    this.data = [];
    this.provinceNames = [];
  }
  async provinces() {
    try {
      await this.driver.get(this.allowedDomains[0]);
      await this.driver.wait(until.elementLocated(By.css("body")), 50000);
      let selector = await this.driver.findElement(By.id("province"));
      let options = await selector.findElements(By.css("option"));

      for (let option of options) {
        let value = await option.getAttribute("value");
        if (value !== "0") {
          let textContent = await option.getText();
          this.provinceNames.push(textContent);
        }
      }

      console.log(`Number of Provinces: ${this.provinceNames.length}`);
      console.log(this.provinceNames);

      if (this.provinceNames.length) this.provinceDistrcts();
    } catch (error) {
      // this.driver.quit();
      console.log(error)
    }
  }
  async provinceDistrcts() {
    try {
      let districts = [];
      for (let province of this.provinceNames) {
        let provinceData = {
          province,
          districts: {
            numberOfDistricts: 0,
            districtList: [],
          },
        };

        let provinceSelector = await this.driver.findElement(By.id("province"));
        let provinceOption = await provinceSelector.findElement(
          By.xpath(`//option[contains(.,'${province}')]`)
        );
        provinceOption.click();
       
        let districtSelector = await this.driver.findElement(By.id("district"));
        let districtOptions = await districtSelector.findElements(By.css("option"));

        for (let districtOption of districtOptions) {
          let text = await districtOption.getText();
          if (
            !["please select a district", "all"].includes(text.toLowerCase())
          ) {
            
            provinceData.districts.districtList.push({ district: text });
            provinceData.districts.numberOfDistricts += 1;
          }
        }
        districts.push(provinceData);
        console.log(provinceData.province)
        console.log(provinceData.districts.districtList);
      }
      console.log(districts);
    } catch (error) {
      console.log(error);
    }
  }
  async districtInfo() {
    try {
    } catch (error) {
      console.log(error);
    }
  }
}
