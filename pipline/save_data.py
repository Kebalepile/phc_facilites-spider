import json

def save_to_database(data, file_name="data"):
        if len(data) > 0:
            with open(f"database/{file_name}.json", "w") as file:
                json.dump(data, file, indent=4)
            print("Data saved in the database folder.")
        else:
            print("No data scraped.")
