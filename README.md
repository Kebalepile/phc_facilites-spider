# Primary Health Care Facilities Scraper

This project is a web scraper that collects data on primary health care facilities from the [South African Health Establishments website](https://www.healthestablishments.org.za/Home/Facility). The scraper is written in Python and uses the Selenium library to interact with web pages and extract data.

## Installation
To install the scraper, you will need to have Python 3.x installed on your computer. You can download Python from the [official website](https://www.python.org/downloads/).

It is recommended that you install the scraper in a virtual environment to avoid conflicts with other Python packages on your system. You can create a virtual environment using the venv module that comes with Python by running the following command in your terminal:

`python -m venv env`
This will create a new virtual environment in a folder named env in the current directory. To activate the virtual environment, run the following command:

* On macOS and Linux:
`source env/bin/activate`
* On Windows:
`.\env\Scripts\activate`
Once you have activated the virtual environment, you can install the required dependencies by running the following command:

`pip install -r requirements.txt`
This will install the Selenium library, as well as any other dependencies specified in the `requirements.txt` file.

## Usage
To use the scraper, navigate to the project directory in your terminal and run the following command:

`python scraper.py`
This will start the scraper and begin collecting data on primary health care facilities. The collected data will be cleaned and saved to a JSON file in the `database` folder.

Please note that due to the dynamic nature of the website being scraped, which uses CSS transitions and JavaScript to load components and fetch data, the scraper may need to run for up to 24 hours in order to collect all data in one go. If you are unable to run the scraper for such an extended period of time, you have a few options:

* You can access already scraped data by going to the `database` folder and opening the `processed_data.json` file.

* You can run the scraper for shorter periods of time, such as 3 hours per day, and scrape one province at a time. The scraped data will be saved to the `data.json` file and the scraper will build upon it when run again, as long as it has not scraped all data from the website.

## Contributing

Contributions to this project are welcome! If you would like to contribute, please fork the repository and submit a pull request with your changes.

Before submitting a pull request, please make sure that your changes follow the project’s coding style and that all tests pass.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more information.
