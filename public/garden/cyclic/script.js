let currentYear = new Date().getFullYear();
let currentQuarter = 1;
const today = new Date();
let startDayOfWeek = 0;
let currentLanguage = 'ja';
let viewMode = 'year';

const languages = {
    ja: {
        name: 'Japanese',
        codes: ['&#26085;', '&#26376;', '&#28779;', '&#27700;', '&#26408;', '&#37329;', '&#22303;'],
        days: ['日 Sunday', '月 Monday', '火 Tuesday', '水 Wednesday', '木 Thursday', '金 Friday', '土 Saturday']
    },
    en: {
        name: 'English',
        codes: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        days: ['S Sunday', 'M Monday', 'T Tuesday', 'W Wednesday', 'T Thursday', 'F Friday', 'S Saturday']
    },
    sc: {
        name: 'Scandinavian',
        codes: ['S', 'M', 'T', 'O', 'T', 'F', 'L'],
        days: ['S Sunday', 'M Monday', 'T Tuesday', 'O Wednesday', 'T Thursday', 'F Friday', 'L Saturday']
    },
    ko: {
        name: 'Korean',
        codes: ['&#51068;', '&#50900;', '&#54868;', '&#49688;', '&#47785;', '&#44552;', '&#53664;'],
        days: ['일 Sunday', '월 Monday', '화 Tuesday', '수 Wednesday', '목 Thursday', '금 Friday', '토 Saturday']
    },
    fr: {
        name: 'French',
        codes: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
        days: ['D Sunday', 'L Monday', 'M Tuesday', 'M Wednesday', 'J Thursday', 'V Friday', 'S Saturday']
    }
};

function changeYear(delta) {
    if (viewMode === 'year') {
        currentYear += delta;
        updateYearDisplay();
    } else {
        currentQuarter += delta;
        if (currentQuarter > 4) {
            currentQuarter = 1;
            currentYear++;
        } else if (currentQuarter < 1) {
            currentQuarter = 4;
            currentYear--;
        }
        updateYearDisplay();
    }
    renderCalendar();
}

function updateYearDisplay() {
    const display = document.getElementById('yearDisplay');
    if (viewMode === 'year') {
        display.textContent = currentYear;
    } else {
        display.textContent = currentYear + '.Q' + currentQuarter;
    }
}

function toggleYearInput() {
    const display = document.getElementById('yearDisplay');
    const input = document.getElementById('yearInput');

    display.style.display = 'none';
    input.style.display = 'inline';
    input.value = currentYear;
    input.focus();
    input.select();
}

function applyYearInput() {
    const display = document.getElementById('yearDisplay');
    const input = document.getElementById('yearInput');

    const newYear = parseInt(input.value);
    if (!isNaN(newYear) && newYear > 1900 && newYear < 2200) {
        currentYear = newYear;
        updateYearDisplay();
        renderCalendar();
    }

    input.style.display = 'none';
    display.style.display = 'inline';
}

function handleYearKeypress(event) {
    if (event.key === 'Enter') {
        applyYearInput();
    }
}

function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

let activeFrog = null;

function openLeapWeekModal(event) {
    event.stopPropagation();
    const modal = document.getElementById('leapWeekModal');
    const bubble = document.getElementById('speechBubble');
    const frogIcon = event.currentTarget;

    activeFrog = frogIcon;
    frogIcon.classList.add('active');

    modal.classList.add('active');

    const rect = frogIcon.getBoundingClientRect();
    const frogCenterX = rect.left + (rect.width / 2);

    const tailOffsetFromLeft = 25;
    bubble.style.left = (frogCenterX - tailOffsetFromLeft) + 'px';
    bubble.style.top = (rect.top - bubble.offsetHeight - 15) + 'px';
}

function closeModal(event) {
    const modal = document.getElementById('leapWeekModal');
    const bubble = document.getElementById('speechBubble');

    if (!event || event.target === modal) {
        modal.classList.remove('active');

        if (activeFrog) {
            activeFrog.classList.remove('active');
            activeFrog = null;
        }
    }
}

function changeLanguage() {
    currentLanguage = document.getElementById('languageSelect').value;
    updateStartDayOptions();
    renderCalendar();
}

function updateStartDayOptions() {
    const select = document.getElementById('startDaySelect');
    const currentValue = select.value;
    const lang = languages[currentLanguage];

    select.innerHTML = '';
    for (let i = 0; i < 7; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = lang.days[i];
        select.appendChild(option);
    }

    select.value = currentValue;
}

function changeStartDay() {
    startDayOfWeek = parseInt(document.getElementById('startDaySelect').value);
    renderCalendar();
}

function changeViewMode() {
    viewMode = document.getElementById('viewModeSelect').value;
    if (viewMode === 'quarter') {
        const todayMonth = today.getMonth();
        currentQuarter = Math.floor(todayMonth / 3) + 1;
    }
    updateYearDisplay();
    renderCalendar();
}

document.addEventListener('click', function(event) {
    const panel = document.getElementById('settingsPanel');
    const button = document.querySelector('.settings-button');
    if (!panel.contains(event.target) && event.target !== button) {
        panel.style.display = 'none';
    }
});

function renderCalendar() {
    const container = document.getElementById('quartersContainer');
    container.innerHTML = '';
    container.className = 'quarters-container ' + (viewMode === 'year' ? 'year-view' : 'quarter-view');

    const startDate = new Date(currentYear, 0, 1);
    const dayOfWeek = startDate.getDay();

    let offset;
    if (dayOfWeek === startDayOfWeek) {
        offset = 0;
    } else if (dayOfWeek < startDayOfWeek) {
        offset = startDayOfWeek - dayOfWeek;
    } else {
        offset = 7 - dayOfWeek + startDayOfWeek;
    }

    let firstDay = new Date(currentYear, 0, 1 + offset);

    if (firstDay.getDate() > 4) {
        firstDay.setDate(firstDay.getDate() - 7);
    }

    let currentDate = new Date(firstDay);

    let markedMonths = new Set();

    const allDayCodes = languages[currentLanguage].codes;

    const dayCodes = [];
    for (let i = 0; i < 7; i++) {
        dayCodes.push(allDayCodes[(startDayOfWeek + i) % 7]);
    }

    const startQuarter = viewMode === 'year' ? 0 : currentQuarter - 1;
    const endQuarter = viewMode === 'year' ? 4 : currentQuarter;

    if (viewMode === 'quarter') {
        const weeksToSkip = (currentQuarter - 1) * 13;
        currentDate.setDate(currentDate.getDate() + (weeksToSkip * 7));
    }

    for (let quarter = startQuarter; quarter < endQuarter; quarter++) {
        const quarterDiv = document.createElement('div');
        quarterDiv.className = 'quarter';

        const weekHeaders = document.createElement('div');
        weekHeaders.className = 'week-headers';
        dayCodes.forEach(code => {
            const header = document.createElement('div');
            header.className = 'day-header';
            header.innerHTML = code;
            weekHeaders.appendChild(header);
        });
        quarterDiv.appendChild(weekHeaders);

        const calendar = document.createElement('div');
        calendar.className = 'calendar';

        for (let cycle = 0; cycle < 3; cycle++) {
            for (let week = 0; week < 4; week++) {
                const weekRow = document.createElement('div');
                weekRow.className = 'week-row';

                const monthMarker = document.createElement('div');
                monthMarker.className = 'month-marker';

                let hasNewMonth = false;
                let newMonthNumber = null;

                for (let day = 0; day < 7; day++) {
                    const testDate = new Date(currentDate);
                    testDate.setDate(testDate.getDate() + day);
                    if (testDate.getDate() === 1) {
                        hasNewMonth = true;
                        newMonthNumber = testDate.getMonth() + 1;
                        break;
                    }
                }

                if (hasNewMonth) {
                    let monthKey = currentYear + '-' + newMonthNumber;
                    if (!markedMonths.has(monthKey)) {
                        monthMarker.textContent = newMonthNumber < 10 ? '0' + newMonthNumber : newMonthNumber;
                        markedMonths.add(monthKey);
                    }
                }
                else if (quarter === 0 && cycle === 0 && week === 0) {
                    let startMonth = currentDate.getMonth() + 1;
                    monthMarker.textContent = startMonth < 10 ? '0' + startMonth : startMonth;
                    markedMonths.add(currentYear + '-' + startMonth);
                }

                weekRow.appendChild(monthMarker);

                const weekDays = document.createElement('div');
                weekDays.className = 'week-days';

                for (let day = 0; day < 7; day++) {
                    const dayDiv = document.createElement('div');
                    dayDiv.className = 'day';
                    const dateNum = currentDate.getDate();
                    dayDiv.textContent = dateNum < 10 ? '0' + dateNum : dateNum;

                    if (currentDate.getFullYear() === today.getFullYear() &&
                        currentDate.getMonth() === today.getMonth() &&
                        currentDate.getDate() === today.getDate()) {
                        dayDiv.classList.add('today');
                    }

                    weekDays.appendChild(dayDiv);
                    currentDate.setDate(currentDate.getDate() + 1);
                }

                weekRow.appendChild(weekDays);
                calendar.appendChild(weekRow);
            }

            if (cycle < 2) {
                const cycleBreak = document.createElement('div');
                cycleBreak.className = 'cycle-break';
                calendar.appendChild(cycleBreak);
            }
        }

        const resetBreak = document.createElement('div');
        resetBreak.className = 'reset-break';
        calendar.appendChild(resetBreak);

        const resetRow = document.createElement('div');
        resetRow.className = 'week-row';

        const resetMarker = document.createElement('div');
        resetMarker.className = 'month-marker';

        let hasNewMonthInReset = false;
        let resetNewMonthNumber = null;

        for (let day = 0; day < 7; day++) {
            const testDate = new Date(currentDate);
            testDate.setDate(testDate.getDate() + day);
            if (testDate.getDate() === 1) {
                hasNewMonthInReset = true;
                resetNewMonthNumber = testDate.getMonth() + 1;
                break;
            }
        }

        if (hasNewMonthInReset) {
            let monthKey = currentYear + '-' + resetNewMonthNumber;
            if (!markedMonths.has(monthKey)) {
                resetMarker.textContent = resetNewMonthNumber < 10 ? '0' + resetNewMonthNumber : resetNewMonthNumber;
                markedMonths.add(monthKey);
            }
        }

        resetRow.appendChild(resetMarker);

        const resetDays = document.createElement('div');
        resetDays.className = 'week-days';

        for (let day = 0; day < 7; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day';
            const dateNum = currentDate.getDate();
            dayDiv.textContent = dateNum < 10 ? '0' + dateNum : dateNum;

            if (currentDate.getFullYear() === today.getFullYear() &&
                currentDate.getMonth() === today.getMonth() &&
                currentDate.getDate() === today.getDate()) {
                dayDiv.classList.add('today');
            }

            resetDays.appendChild(dayDiv);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        resetRow.appendChild(resetDays);
        calendar.appendChild(resetRow);

        if (quarter === 3) {
            const nextYear = currentYear + 1;
            const jan1NextYear = new Date(nextYear, 0, 1);
            const jan1DayOfWeek = jan1NextYear.getDay();

            let nextYearOffset;
            if (jan1DayOfWeek === startDayOfWeek) {
                nextYearOffset = 0;
            } else if (jan1DayOfWeek < startDayOfWeek) {
                nextYearOffset = startDayOfWeek - jan1DayOfWeek;
            } else {
                nextYearOffset = 7 - jan1DayOfWeek + startDayOfWeek;
            }

            let nextYearIdealStart = new Date(nextYear, 0, 1 + nextYearOffset);

            if (nextYearIdealStart.getDate() > 4) {
                nextYearIdealStart.setDate(nextYearIdealStart.getDate() - 7);
            }

            if (nextYearIdealStart.getDate() === 4) {
                let leapWeeksNeeded = 0;
                let testDate = new Date(currentDate);

                while (true) {
                    let weekEndDate = new Date(testDate);
                    weekEndDate.setDate(weekEndDate.getDate() + 7);

                    if (weekEndDate >= nextYearIdealStart) {
                        leapWeeksNeeded++;
                        break;
                    }

                    leapWeeksNeeded++;
                    testDate.setDate(testDate.getDate() + 7);
                }

                for (let leapWeek = 0; leapWeek < leapWeeksNeeded; leapWeek++) {
                    const leapRow = document.createElement('div');
                    leapRow.className = 'week-row leap-week';

                    const leapMarker = document.createElement('div');
                    leapMarker.className = 'month-marker';

                    const frogIcon = document.createElement('span');
                    frogIcon.className = 'leap-frog';
                    frogIcon.style.cursor = 'pointer';
                    frogIcon.onclick = openLeapWeekModal;
                    frogIcon.innerHTML = `<svg viewBox="0 0 512 512"><path d="M503.275,233.093c-11.556-11.556-31.804-11.624-57.03-0.205c-14.544,6.579-30.134,16.601-45.462,29.1l4.193-23.907c14.34-17.317,22.214-39.042,22.214-61.631c0-34.156-18.419-65.983-47.519-83.255c0.023-0.693,0.045-1.386,0.045-2.079c0-30.623-24.907-55.53-55.518-55.53c-26.725,0-49.098,18.976-54.359,44.167h-27.611c-5.261-25.191-27.634-44.167-54.359-44.167c-30.611,0-55.518,24.907-55.518,55.53c0,0.693,0.023,1.386,0.045,2.079c-29.1,17.271-47.519,49.098-47.519,83.255c0,4.204,0.273,8.442,0.818,12.613c2.42,18.589,10.124,35.849,22.316,50.11l4.125,23.566c-15.612-12.84-31.543-23.146-46.383-29.85c-25.214-11.42-45.474-11.351-57.03,0.205c-11.556,11.556-11.635,31.816-0.216,57.041c9.874,21.816,27.498,46.008,49.61,68.12c13.999,13.999,28.702,26.021,42.997,35.452H82.502c-6.272,0-11.363,5.091-11.363,11.363s5.091,11.363,11.363,11.363h80.244c2.318,0,6.499-1.738,6.613-1.67l-13.203,13.203c-5.125-0.727-10.51,0.864-14.442,4.806c-6.659,6.647-6.659,17.442,0,24.1c6.659,6.659,17.442,6.659,24.1,0c3.943-3.943,5.534-9.329,4.806-14.442l8.056-8.056v11.385c-4.136,3.113-6.818,8.045-6.818,13.613c0,9.42,7.624,17.044,17.044,17.044c9.408,0,17.044-7.624,17.044-17.044c0-5.568-2.682-10.499-6.818-13.613v-11.385l8.056,8.056c-0.727,5.113,0.864,10.499,4.806,14.442c6.647,6.659,17.442,6.659,24.1,0c6.659-6.659,6.659-17.453,0-24.1c-3.943-3.943-9.329-5.534-14.453-4.806l-13.192-13.192c7.908-5.659,13.272-14.624,14.056-24.862c11.056,2.67,22.407,4.022,33.895,4.022c11.26,0,22.362-1.295,33.191-3.852c0.818,10.17,6.17,19.067,14.033,24.691l-13.192,13.192c-5.125-0.727-10.51,0.864-14.453,4.806c-6.659,6.647-6.659,17.442,0,24.1c6.659,6.659,17.453,6.659,24.1,0c3.943-3.943,5.534-9.329,4.806-14.442l8.056-8.056v11.385c-4.136,3.113-6.818,8.045-6.818,13.613c0,9.42,7.636,17.044,17.044,17.044c9.42,0,17.044-7.624,17.044-17.044c0-5.568-2.682-10.499-6.818-13.613v-11.385l8.056,8.056c-0.727,5.113,0.864,10.499,4.806,14.442c6.659,6.659,17.442,6.659,24.1,0c6.659-6.659,6.659-17.453,0-24.1c-3.932-3.943-9.317-5.534-14.442-4.806l-11.533-11.533h85.914c6.272,0,11.363-5.091,11.363-11.363s-5.091-11.363-11.363-11.363h-19.407c14.294-9.431,28.998-21.453,42.997-35.452c22.112-22.112,39.735-46.303,49.61-68.12C514.911,264.908,514.831,244.648,503.275,233.093z M107.603,176.233c0.091-28.134,16.499-54.2,41.86-66.438v-0.023c4.534-2.193,7.227-7.227,6.204-12.408c-0.386-2.011-0.591-4.113-0.591-6.25c0-18.089,14.715-32.804,32.793-32.804c18.089,0,32.804,14.715,32.804,32.804c0,6.272,5.091,11.363,11.363,11.363h47.996c3.136,0,5.977-1.273,8.033-3.329s3.329-4.897,3.329-8.033c0-18.089,14.715-32.804,32.804-32.804c18.078,0,32.793,14.715,32.793,32.804c0,2.136-0.205,4.238-0.591,6.25c-1.023,5.181,1.67,10.215,6.204,12.408v0.023c25.362,12.238,41.769,38.304,41.86,66.438H107.603z M111.102,198.959h289.852c-3.159,9.897-8.386,19.089-15.476,26.964c-0.08,0.091-0.159,0.182-0.239,0.273c-14.033,15.397-33.963,24.214-54.746,24.214h-148.92c-20.93,0-40.974-8.931-54.996-24.498C119.488,218.026,114.25,208.879,111.102,198.959z M74.185,342.186c-46.076-46.076-56.802-85.618-49.394-93.027c7.409-7.397,46.951,3.329,93.015,49.394c1.648,1.636,3.147,3.193,4.591,4.693c7.363,18.43,18.624,35.327,32.804,49.257v34.838c0,2.079,0.205,4.113,0.557,6.09C138.327,391.216,106.978,374.979,74.185,342.186z M337.902,339.845c-0.466,0.42-0.761,0.727-0.932,0.954c-1.761,2-2.829,4.613-2.829,7.488v39.054c0,4.659-2.92,8.636-7.034,10.226h-0.011c-1.216,0.477-2.545,0.75-3.931,0.75c-6.056,0-10.976-4.931-10.976-10.976v-27.293c0-6.284-5.091-11.363-11.363-11.363s-11.363,5.079-11.363,11.363v6.568c-10.715,3.034-21.794,4.591-33.066,4.591c-11.51,0-22.839-1.636-33.793-4.806v-6.352c0-6.284-5.091-11.363-11.363-11.363s-11.363,5.079-11.363,11.363v27.293c0,6.045-4.92,10.976-10.976,10.976s-10.976-4.931-10.976-10.976V347.64c0-3.182-1.318-6.056-3.42-8.124c-0.08-0.08-0.159-0.159-0.273-0.261c-13.897-12.715-24.782-28.714-31.463-46.28c-0.045-0.114-0.102-0.239-0.148-0.352c-2.693-7.102-4.727-14.522-6.045-22.066l-1.648-9.442c14.158,7.795,30.191,12.022,46.644,12.022h148.92c16.76,0,33.1-4.397,47.462-12.476l-1.739,9.897c-1.25,7.181-3.17,14.294-5.693,21.135C363.753,310.064,352.469,326.71,337.902,339.845z M482.788,280.759c-8.772,19.385-24.748,41.201-44.974,61.427c-32.747,32.747-64.052,48.985-81.505,51.235c0.364-1.977,0.557-4,0.557-6.079v-34.145c14.897-14.419,26.589-32.031,34.077-51.337c1.114-1.136,2.204-2.25,3.25-3.307c46.076-46.065,85.607-56.802,93.015-49.394C490.595,252.546,490.538,263.636,482.788,280.759z"/></svg><span class="tooltip">Leap week</span>`;
                    leapMarker.appendChild(frogIcon);

                    if (viewMode === 'year') {
                        let hasLeapMonth = false;
                        for (let day = 0; day < 7; day++) {
                            const testLeapDate = new Date(currentDate);
                            testLeapDate.setDate(testLeapDate.getDate() + day);
                            if (testLeapDate.getDate() === 1) {
                                hasLeapMonth = true;
                                const leapMonthNum = testLeapDate.getMonth() + 1;
                                let monthKey = currentYear + '-' + leapMonthNum;
                                if (!markedMonths.has(monthKey)) {
                                    const monthText = document.createTextNode(' ' + (leapMonthNum < 10 ? '0' + leapMonthNum : leapMonthNum));
                                    leapMarker.appendChild(monthText);
                                    markedMonths.add(monthKey);
                                }
                                break;
                            }
                        }
                    }

                    leapRow.appendChild(leapMarker);

                    const leapDays = document.createElement('div');
                    leapDays.className = 'week-days';

                    for (let day = 0; day < 7; day++) {
                        const dayDiv = document.createElement('div');
                        dayDiv.className = 'day';

                        const dateNum = currentDate.getDate();
                        dayDiv.textContent = dateNum < 10 ? '0' + dateNum : dateNum;

                        if (currentDate.getFullYear() === today.getFullYear() &&
                            currentDate.getMonth() === today.getMonth() &&
                            currentDate.getDate() === today.getDate()) {
                            dayDiv.classList.add('today');
                        }

                        leapDays.appendChild(dayDiv);
                        currentDate.setDate(currentDate.getDate() + 1);
                    }

                    leapRow.appendChild(leapDays);
                    calendar.appendChild(leapRow);
                }
            }
        }

        quarterDiv.appendChild(calendar);
        container.appendChild(quarterDiv);
    }
}

updateStartDayOptions();
renderCalendar();
