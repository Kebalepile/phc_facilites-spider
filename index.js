import { launch } from "puppeteer";
import { HealthEstablishmentsSpider } from "./spiders/healthEstablishments.js";
async function crawler() {
  const browser = await launch({ headless: false });

  const spider = new HealthEstablishmentsSpider(browser);
  await spider.provincesData();
}

crawler();
