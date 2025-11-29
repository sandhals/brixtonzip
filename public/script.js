// Only run this script once
if (!window.__brixtonScriptInitialized) {
  window.__brixtonScriptInitialized = true;

  // Time/Status logic
  const currentTimeZone = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
  }).resolvedOptions().timeZone;
  const currentCity = currentTimeZone.split("/")[1];

  function updateInfo() {
    const currentTime = new Date(
      new Date().toLocaleString("en-US", { timeZone: currentTimeZone }),
    );
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    const options = { weekday: "long" };
    const today = currentTime
      .toLocaleDateString("en-US", options)
      .toUpperCase();
    const formattedTime = `${String(hours).padStart(2, "0")}:${String(
      minutes,
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    let statusMessage = "";

    if (
      currentTime.getDay() >= 1 &&
      currentTime.getDay() <= 5 &&
      hours >= 9 &&
      hours < 18
    ) {
      statusMessage = "\u00A0AT\u00A0WORK\u00A0";
    } else if (
      (currentTime.getDay() >= 1 &&
        currentTime.getDay() <= 5 &&
        hours >= 18 &&
        hours < 20) ||
      (currentTime.getDay() === 6 && hours >= 11 && hours < 13) ||
      (currentTime.getDay() === 0 && hours >= 11 && hours < 13)
    ) {
      statusMessage = "\u00A0AT\u00A0THE\u00A0GYM\u00A0";
    } else if (
      (currentTime.getDay() >= 0 && currentTime.getDay() <= 4 && hours >= 23) ||
      (currentTime.getDay() >= 1 &&
        currentTime.getDay() <= 5 &&
        hours >= 0 &&
        hours < 7) ||
      (currentTime.getDay() === 6 && hours >= 2 && hours < 10) ||
      (currentTime.getDay() === 0 && hours >= 2 && hours < 10)
    ) {
      statusMessage = "\u00A0SLEEPING\u00A0";
    } else if (
      (currentTime.getDay() === 0 && hours >= 13 && hours < 21) ||
      (currentTime.getDay() === 5 && hours >= 20) ||
      (currentTime.getDay() === 6 && hours < 2) ||
      (currentTime.getDay() === 6 && hours > 13)
    ) {
      statusMessage = "\u00A0DOWNTOWN\u00A0";
    } else {
      statusMessage = "\u00A0AT\u00A0HOME\u00A0";
    }

    if (currentCity === "Seoul") {
      document.getElementById("currentTime").innerText =
        formattedTime + "\u00A0";
      document.getElementById("currentWeekday").innerText =
        "\u00A0" + today + "\u00A0";
      document.getElementById("myStatus").innerText = statusMessage;
    } else {
      document.getElementById("currentStatus").innerText =
        "I\u00A0AM\u00A0ON\u00A0HOLIDAY\u00A0IN\u00A0" +
        currentCity.toUpperCase() +
        "\u00A0RIGHT\u00A0NOW\u00A0WHERE\u00A0IT'S\u00A0CURRENTLY\u00A0" +
        formattedTime;
    }
  }

  setInterval(updateInfo, 1000);

  window.onload = function () {
    const container = document.querySelector(".sourcecode");
    const content = document.querySelector(".content");
    const wrapper = document.querySelector(".container");
    const trigger = document.querySelector(".showsource");

    if (!container || !content || !wrapper || !trigger) return;

    // Fetch the live GitHub code
    fetch(
      "https://raw.githubusercontent.com/sandhals/brixtonzip/main/pages/index.tsx",
    )
      .then((res) => res.text())
      .then((code) => {
        container.textContent = code; // preserve spacing and formatting
      })
      .catch((err) => {
        console.error("Failed to fetch code:", err);
        container.textContent = "Unable to load source code at this time.";
      });

    // Show source toggle (final version)
    trigger.addEventListener("click", () => {
      document.body.classList.add("is-showing-source");

      const heartSpan = trigger.querySelector("span#heart");
      if (heartSpan) heartSpan.textContent = "💙";

      let hideButton = document.querySelector(".hidesource");
      if (!hideButton) {
        hideButton = document.createElement("div");
        hideButton.className = "hidesource";
        hideButton.innerText = "this site was handmade with love 💙";
        document.body.appendChild(hideButton);
      }

      hideButton.onclick = () => {
        // remove class so layout snaps back
        document.body.classList.remove("is-showing-source");
        hideButton.remove();

        if (heartSpan) heartSpan.textContent = "🩶";

        // scroll smoothly to the bottom
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      };

      // always start at the top when showing source
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };
}
