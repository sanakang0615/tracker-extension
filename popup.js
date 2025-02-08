document.addEventListener("DOMContentLoaded", function () {
    const historyList = document.getElementById("history-list");

    // Fetch browsing history (last 10 entries)
    chrome.history.search({ text: "", maxResults: 10 }, function (data) {
        data.forEach((item) => {
            const li = document.createElement("li");
            li.textContent = `${item.title} - ${item.url}`;
            historyList.appendChild(li);
        });
    });
});
