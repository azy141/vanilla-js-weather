let unitSystem = "metric";
document.getElementById("unit-switch").addEventListener("change", function () {
  if (this.checked) {
    unitSystem = "metric";
  } else {
    unitSystem = "imperial";
  }
})

function getUnitSymbol() {
  if (unitSystem == "metric") {
    return "°C";
  }
  if (unitSystem = "imperial") {
    return "°F";
  }
}

// Uses browsers location API.
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  }
  else {
    unableToFindLocation("Geolocation is not supported by this browser");
  }
}

// Callback function when using location API.
function showPosition(position) {
  document.getElementById("loader").classList.remove("hide");
  getLocationName(position.coords.longitude, position.coords.latitude);
  getWeather(position.coords.longitude, position.coords.latitude);
}

// Gets the name of a location from a long and lat.
async function getLocationName(longitude, latitude) {
  const APIKey = "57cdd277e797011e6b3e675f9e1108bf3b84e0c6";
  try {
    const response = await fetch(`https://api.geocodify.com/v2/reverse?api_key=${APIKey}&lat=${latitude}&lng=${longitude}`, {mode: 'cors'});
    const locationData = await response.json();
    if (locationData.response.features[0]) {
      const label = locationData.response.features[0].properties.label;
      assignLocationName(label);
    }
  }
  catch (error) {
    console.log(error)
  }
  finally {
    document.getElementById("loader").classList.add("hide");
  }
}

// Assigns the location name.
function assignLocationName(label) {
  const locationTag = document.getElementById("location");
  locationTag.textContent = label;
}

// Gets the long and lat from a search term.
async function getLongLat() {
  const geocodifyAPIKey = "57cdd277e797011e6b3e675f9e1108bf3b84e0c6";
  let searchTerm = document.getElementById("search").value;
  if (searchTerm) {
    document.getElementById("loader").classList.remove("hide");
    try {
      const response = await fetch(`https://api.geocodify.com/v2/geocode?api_key=${geocodifyAPIKey}&q=${searchTerm}`, {mode: 'cors'});
      const locationData = await response.json();

      if (locationData.response.features[0]) {
        const label = locationData.response.features[0].properties.label;
        const longitude = locationData.response.features[0].geometry.coordinates[0];
        const latitude = locationData.response.features[0].geometry.coordinates[1];

        assignLocationName(label);
        getWeather(longitude, latitude)
      }
      else {
        unableToFindLocation("Unable to find" + searchTerm);
      }
    }
    catch (error) {
      console.log(error);
    }
    finally {
      document.getElementById("loader").classList.add("hide");
    }
  }
}

// Gets weather data for a given long and lat.
async function getWeather(longitude, latitude) {
  const openWeatherMapAPIKey = "132fae47c1d7bf160203aab8c6714bdf";
  const exclude = "minutely, alerts";

  try {
    document.getElementById("loader").classList.remove("hide");
    const response = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=${exclude}&appid=${openWeatherMapAPIKey}&units=${unitSystem}`, {mode: 'cors'});
    const weatherData = await response.json();

    // Check if there's already weather data showing.
    const currentWeatherDataDiv = document.querySelector(".current-weather-data");
    const weeklyWeatherDataDiv = document.querySelector(".weekly-weather-data");
    if (currentWeatherDataDiv) {
      currentWeatherDataDiv.remove();
    }
    if (weeklyWeatherDataDiv) {
      weeklyWeatherDataDiv.remove();
    }

    // Create current weather div.
    let currentWeatherData = tagFactory("div", "current-weather-data", "Current");
    createWeatherDiv(weatherData.current, currentWeatherData);
    document.body.appendChild(currentWeatherData);

    // Create weekly weather data div.
    let weeklyWeatherData = tagFactory("div", "weekly-weather-data");
    weatherData.daily.forEach(function (day) {
      createWeatherDiv(day, weeklyWeatherData);
    });

    document.body.appendChild(weeklyWeatherData);
  }
  catch (error) {
    console.log(error);
  }
  finally {
    document.getElementById("loader").classList.add("hide");
  }
}

// Returns a JS date object from unixtime given from API.
function dateTimeFromWeather(unixtime) {
  const milliseconds = unixtime * 1000;
  const dateObject = new Date(milliseconds);
  return dateObject;
}

// Turns the OpenWeatherMap icon id into a full URL.
function getWeatherIconURL(id) {
  return `https://openweathermap.org/img/wn/${id}@4x.png`
}

// Creates the weather div for a given day, uses OpenWeatherMap JSON structure.
function createWeatherDiv(weather, tag) {
  let dateTimeOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour12: false
  };
  let unit = getUnitSymbol();
  // Create parent container.
  const content = tagFactory("div", "weather");

  // Create and set date div.
  let dateTime = dateTimeFromWeather(weather.dt);
  let dateTimeText = tagFactory("div", "weather-date", dateTime.toLocaleString("en-GB", dateTimeOptions));
  content.appendChild(dateTimeText);

  // Create parent div for icon and high/low temps.
  const iconAndHighLowTemps = tagFactory("div", "weather-icon-temps");

  // Create and set icon img.
  let img = tagFactory("img", "weather-icon");
  img.src = getWeatherIconURL(weather.weather[0].icon);
  iconAndHighLowTemps.appendChild(img);

  // Create parent div for icon and high/low temps.
  const highLowTemps = tagFactory("div", "weather-high-low-temps");

  let temperatureHigh = tagFactory("div", "temperature-high");
  if (weather.temp.max) {
    temperatureHigh.textContent = "High: " + weather.temp.max + unit;
    highLowTemps.appendChild(temperatureHigh);
  }

  let temperatureLow = tagFactory("div", "temperature-low");
  if (weather.temp.min) {
    temperatureLow.textContent = "Low: " + weather.temp.min + unit;
    highLowTemps.appendChild(temperatureLow);
  }
  if (weather.temp.max || weather.temp.min) {
    iconAndHighLowTemps.appendChild(highLowTemps);
  }
  content.appendChild(iconAndHighLowTemps);

  // Create and set day temperature div.
  let temperature = tagFactory("div", "temperature");
  if (weather.temp.day) {
    temperature.textContent = weather.temp.day + unit;
  }
  if (weather.temp && !weather.temp.day) {
    temperature.textContent = weather.temp + unit;
  }
  content.appendChild(temperature);

  // Create and set description div.
  let description = tagFactory("div", "weather-description", weather.weather[0].description)
  content.appendChild(description);

  tag.appendChild(content);
}

// Creates a given tag with class name and text content.
function tagFactory(tag, className, textContent) {
  if (tag) {
    let newTag = document.createElement(tag);
    if (className) {
      newTag.classList.add(className);
    }
    if (textContent) {
      newTag.textContent = textContent;
    }
    return newTag;
  }
}

// Displays an error message for 3 seconds in place of the location heading.
async function unableToFindLocation(message) {
  const messageField = document.getElementById("location");
  const currentText = messageField.innerHTML;
  messageField.innerHTML = "<span style='color: red;'>" + message + "</span>";
  await new Promise(r => setTimeout(r, 3000));
  messageField.innerHTML = currentText;
}
