def refine_data(raw_data):

    cleaned_data = []
    
    for data in raw_data:
        processed_data = {}
        for key, value in data.items():
            if isinstance(value, dict):
                processed_data[key.replace(" ", "_")] = refine_data(value)
            else:
                lowercase_key = key.lower()
                if lowercase_key == "latitude" or lowercase_key == "longitude" or "/" in key or is_date_like(key):
                    processed_data[key] = value
                else:
                    try:
                        processed_data[key.replace(" ", "_")] = int(value)
                    except ValueError:
                        processed_data[key.replace(" ", "_")] = value
    return cleaned_data

def is_date_like(key):
    parts = key.split("/")
    if len(parts) == 3:
        try:
            int(parts[0])
            int(parts[1])
            int(parts[2])
            return True
        except ValueError:
            pass
    return False
