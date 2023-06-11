import json
from pipline.clean_data import refine_data

def save_to_database(data, file_name="data"):
        if len(data) > 0:
            clean_data = refine_data(data)
            with open(f"database/{file_name}.json", "w") as file:
                json.dump(clean_data, file, indent=4)
            print("Data saved in the database folder.")
        else:
            print("No data scraped.")
