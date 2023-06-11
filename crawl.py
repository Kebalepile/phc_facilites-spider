import asyncio
from spiders.health_care_facilities import Health_Facilities_Spider


async def crawler():
    purpose = "Government Service Data Crawler"
    print(f"{purpose} initiating.")
    health_facility_spider = Health_Facilities_Spider()
    print("initiating spiders.")
    await health_facility_spider.run()


asyncio.run(crawler())
