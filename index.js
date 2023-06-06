import { launch } from "puppeteer";
import { HealthEstablishmentsSpider } from "./spiders/healthEstablishments.js";
async function crawler() {
  const browser = await launch({ headless: "new" });

  const HESpider = new HealthEstablishmentsSpider(browser);
  await HESpider.startSpider();
}

crawler();
