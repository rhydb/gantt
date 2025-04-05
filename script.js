var cellWidth = "16px";
var tableHeaderX = [];
var currentSlider = null;

let weeksMode = true;
let tasks = [];


let urlParams = new URLSearchParams(window.location.search);

let months = [
    "january", "february", "march", "april", "may", "june", 
    "july", "august", "september", "october", "november", "december"
];

function updateUrl() {
    const newUrl = window.location.pathname + '?' + urlParams.toString();
    window.history.replaceState({}, '', newUrl);
}

//function getState() {
//    const tasksJson = tasks.map(t => JSON.stringify(t));
//    const state = {
//        tasks: [...tasksJson]
//    }
//    return state;
//}

function setWeeksMode(value) {
    // show the weeks controls and headers
    // reduce the colspan of the month headers and update the colspan of the tasks
    weeksMode = value;
    if (value) {
        const weekControls = document.querySelectorAll(".weekControl");
        for (let e of weekControls) {
            e.classList.remove("hidden");
        }
        const weekHeaders = document.querySelector(".weeks");
        weekHeaders.classList.remove("hidden");

        const monthHeaders = document.querySelectorAll(".month");
        for (let th of monthHeaders) {
            th.colSpan = "4";
        }
    } else {
        const weekControls = document.querySelectorAll(".weekControl");
        for (let e of weekControls) {
            e.classList.add("hidden");
        }
        const weekHeaders = document.querySelector(".weeks");
        weekHeaders.classList.add("hidden");

        const monthHeaders = document.querySelectorAll(".month");
        for (let th of monthHeaders) {
            th.colSpan = "1";
        }
    }
    for (let t of tasks) {
        t.updateColSpan();
    }
}

function randomHexColour() {
    return "#" + Math.trunc(Math.random() * 0xffffff).toString(16);
}

function newTaskColour() {
    if (document.getElementById("default").checked) {
        return document.getElementById("defaultColour").value;
    }
    if (document.getElementById("random").checked) {
        return randomHexColour();
    }
    if (document.getElementById("same").checked) {
        return document.getElementById("sameColour").value;
    }
    return "#AADDFF";
}

function getMonthWidth() {
    return weeksMode ? 4 : 1;
}

class Task {
    constructor(row, {
        startMonth = "january",
        startWeek = 1,
        endMonth = "january",
        endWeek = 1,
        colour = null,
        index = null,
        name = "",
    }) {
        this.index = Number.parseInt(index);

        this.row = row;
        this.startMonth = startMonth;
        this.startWeek = startWeek;
        this.endMonth = endMonth;
        this.endWeek = endWeek;
        this.colour = colour ?? newTaskColour();
        this.name = name;

        if (!weeksMode) {
            const weekControls = this.row.querySelectorAll(".weekControl");
            for (let e of weekControls) {
                e.classList.add("hidden");
            }
        }

        row.querySelector(".removeBtn").addEventListener("click", () => {
            this.deleteParams();
            const index = tasks.indexOf(this);
            for (let i = index+1; i < tasks.length; i++) {
                tasks[i].deleteParams();
                tasks[i].index = i-1;
                tasks[i].updateParams();
            }
            tasks.splice(index, 1);

            this.row.remove();
            updateUrl();
        });
        row.querySelector(".upBtn").addEventListener("click", () => { this.moveUp() })
        row.querySelector(".downBtn").addEventListener("click", () => { this.moveDown() });

        row.querySelector(".startMonth").addEventListener("input", (e) => this.startMonth = e.target.value);
        row.querySelector(".startWeek").addEventListener("input", (e) => this.startWeek = e.target.value);
        row.querySelector(".endMonth").addEventListener("input", (e) => this.endMonth = e.target.value);
        row.querySelector(".endWeek").addEventListener("input", (e) => this.endWeek = e.target.value);
        row.querySelector(".colour").addEventListener("input", (e) => this.colour = e.target.value);
        row.querySelector(".taskName").addEventListener("input", (e) => this.name = e.target.value);
    }

        get startMonthParam() { return `${this.index}_startMonth`; }
        get startWeekParam() { return `${this.index}_startWeek`; }
        get endMonthParam() { return `${this.index}_endMonth`; }
        get endWeekParam() { return `${this.index}_endWeek`; }
        get colourParam() { return `${this.index}_colour`; }
        get nameParam() { return `${this.index}_name`; }

    moveUp() {
        this.row.parentNode.insertBefore(this.row, this.row.previousElementSibling);

        const before = tasks[this.index - 1]
        this.deleteParams();
        before.deleteParams();

        tasks[this.index - 1] = this;
        tasks[this.index] = before;

        before.index += 1;
        this.index -= 1;
        before.updateParams();
        this.updateParams();

        updateUrl();
    }

    moveDown() {
        this.row.parentNode.insertBefore(this.row.nextElementSibling, this.row);

        // remove the two items from the url
        // must do this now while they have the old indexes
        const next = tasks[this.index + 1];
        this.deleteParams();
        next.deleteParams();

        // swap the two tasks
        tasks[this.index + 1] = this;
        tasks[this.index] = next;

        // update the indexes and the url
        next.index -= 1;
        this.index += 1;
        next.updateParams();
        this.updateParams();

        updateUrl();
    }

    toJSON() {
        return {
            index: this.index,
            name: this.name,
            startMonth: this.startMonth,
            startWeek: this.startWeek,
            endMonth: this.endMonth,
            endWeek: this.endWeek,
            colour: this.colour,
        };
    }

    getUrlParams() {
        return {
            [this.startMonthParam]: this.startMonth,
            [this.startWeekParam]: this.startWeek,
            [this.endMonthParam]: this.endMonth,
            [this.endWeekParam]: this.endWeek,
            [this.colourParam]: this.colour,
            [this.nameParam]: this.name,
        }
    }

    deleteParams() {
        Object.keys(this.getUrlParams()).forEach(p => {
            urlParams.delete(p);
        });
    }

    setIndex(value) {
        // delete the old params and set the new ones
        this.deleteParams();
        this.index = value;
        this.updateParams();
    }

    updateParams() {
        Object.entries(this.getUrlParams()).forEach(([p, v]) => {
            urlParams.set(p, v);
        });
    }

    hideName() {
        this.row.querySelector(".taskLength").style.fontSize = 0;
    }
    showName() {
        this.row.querySelector(".taskLength").style.fontSize = "initial";
    }

    get name() {
        return this.row.querySelector(".taskName").value;
    }
    set name(value) {
        this.row.querySelector(".taskName").value = value;
        this.row.querySelector(".taskLength").innerText = value;
        urlParams.set(this.nameParam, value);
        updateUrl()
    }

    get colour() {
        return this.row.querySelector(".colour").value;
    }
    set colour(value) {
        this.row.querySelector(".colour").value = value;
        this.row.querySelector(".taskLength").style.background = value;
        urlParams.set(this.colourParam, value);
        updateUrl();
    }

    get startMonth() {
        return this.row.querySelector(".startMonth").value;
    }
    set startMonth(value) {
        this.row.querySelector(".startMonth").value = value;

        const { startMonthIndex, endMonthIndex } = this.getMonthIndexes();
        if (startMonthIndex > endMonthIndex) {
            // make start and end the same
            this.row.querySelector(".endMonth").value = value;
            if (this.startWeek > this.endWeek) {
                this.row.querySelector(".endWeek").value = this.startWeek + 1;
            }
        }

        this.updateColSpan();
        urlParams.set(this.startMonthParam, value); 
        urlParams.set(this.endMonthParam, this.endMonth); 
        updateUrl()
    }

    get endMonth() {
        return this.row.querySelector(".endMonth").value;
    }
    set endMonth(value) {
        this.row.querySelector(".endMonth").value = value;

        const { startMonthIndex, endMonthIndex } = this.getMonthIndexes();
        if (startMonthIndex > endMonthIndex) {
            // make start and end the same
            this.row.querySelector(".startMonth").value = value;
            if (this.startWeek > this.endWeek) {
                this.row.querySelector(".startWeek").value = this.endWeek;
            }
        }

        this.updateColSpan();
        urlParams.set(this.endMonthParam, value);
        urlParams.set(this.startMonthParam, this.startMonth); 
        updateUrl()
    }

    get startWeek() {
        return Number.parseInt(this.row.querySelector(".startWeek").value);
    }
    set startWeek(n) {
        n = Number.parseInt(n);
        this.row.querySelector(".startWeek").value = n;

        const { startMonthIndex, endMonthIndex } = this.getMonthIndexes();
        if (startMonthIndex === endMonthIndex) {
            if (n > this.endWeek) {
                this.row.querySelector(".endWeek").value = n;
            }
        }

        this.updateColSpan();
        urlParams.set(this.startWeekParam, n);
        urlParams.set(this.endWeekParam, this.endWeek);
        updateUrl()
    }

    get endWeek() {
        return Number.parseInt(this.row.querySelector(".endWeek").value);
    }
    set endWeek(n) {
        n = Number.parseInt(n);
        this.row.querySelector(".endWeek").value = n;

        const { startMonthIndex, endMonthIndex } = this.getMonthIndexes();
        if (startMonthIndex === endMonthIndex) {
            if (n < this.startWeek) {
                this.row.querySelector(".startWeek").value = n;
            }
        }

        this.updateColSpan();
        urlParams.set(this.endWeekParam, n);
        urlParams.set(this.startWeekParam, this.startWeek);
        updateUrl()
    }

    getMonthIndexes() {
        return {
            startMonthIndex: months.indexOf(this.startMonth),
            endMonthIndex: months.indexOf(this.endMonth),
        }
    }

    updateColSpan() {
        const { startMonthIndex, endMonthIndex } = this.getMonthIndexes();

        const empties = this.row.querySelectorAll(".empty");
        const requiredEmpties = startMonthIndex * getMonthWidth() + this.startWeek - 1;
        if (empties.length > requiredEmpties) {
            const toRemove = empties.length - requiredEmpties;
            let removed = 0;
            for (let td of empties) {
                if (removed >= toRemove) {
                    break;
                }
                td.remove();
                removed++;
            }
        } else {
            const toAdd = requiredEmpties - empties.length;
            for (let i = 0; i < toAdd; i++) {
                const td = document.createElement("td");
                td.classList.add("empty");
                const taskLength = this.row.querySelector(".taskLength");
                this.row.insertBefore(td, taskLength);
            }
        }

        const taskLength = this.row.querySelector(".taskLength");
        const colspan = Math.max(1,
            (endMonthIndex - startMonthIndex + (weeksMode ? 0 : 1)) * getMonthWidth() + (this.endWeek) - (this.startWeek-1)
        );
        taskLength.colSpan = colspan;
        taskLength.style.display = "none";
        setTimeout(() => {
            taskLength.style.display = "table-cell";
        }, 0);
    }
}

function createTask(opts = {}) {
    const tbody = document.querySelector("tbody");
    const rowTemplate = document.querySelector("#rowTemplate");
    const clone = rowTemplate.content.cloneNode(true);
    const row = tbody.appendChild(clone.querySelector("tr")); // add the tr from the clone, not the whole template

    if (!opts.name) {
        opts.name = "task" + (tasks.length + 1);
    }

    if (opts.index == null) {
        opts.index = tasks.length;
    }

    console.log("creating task", opts);
    const task = new Task(row, opts)
    if (!document.getElementById("nameInBox").checked) {
        task.hideName();
    }
    tasks.push(task);
    return task;
}

function addTask() {
    let opts = {}
    if (tasks.length > 0) {
        // copy the start/end of the previous task
        const prevTask = tasks[tasks.length - 1];
        opts.startMonth = prevTask.startMonth;
        opts.startWeek = prevTask.startWeek;
        opts.endMonth = prevTask.endMonth;
        opts.endWeek = prevTask.endWeek;
    }
    const task = createTask(opts);
    task.setIndex(tasks.length - 1);
}


function loadTasksFromUrl() {
    const tasksAttributes = {}
    tasks = []

    urlParams.forEach((v, p) => {
        const pattern = /^(\d)_(.+)$/;
        const match = p.match(pattern);
        if (match) {
            const [_, index, attribute] = match;

            if (tasksAttributes[index] == null) {
                tasksAttributes[index] = {}
            }

            tasksAttributes[index][attribute] = v
        }
    })

    const taskList = Object.entries(tasksAttributes).map(([index, attrs]) => ( { index, ...attrs } ));
    taskList.sort((a,b) => a.index - b.index)

    taskList.forEach((attributes, i) => {
        attributes.index = i;
        const task = createTask(attributes);
        task.updateColSpan();
    })
}

function setStartMonth(value) {
    urlParams.set("startMonth", value);
    updateUrl();
    const startIndex = months.indexOf(value);
    months = [
        ...months.slice(startIndex), // the new start up to the end
        ...months.slice(0, startIndex) // the beginning of the array up to the start
    ];

    const headerRow = document.getElementById("january").parentElement;
    const fragment = document.createDocumentFragment();
    months.forEach((m) => {
        const header = document.getElementById(m);
        if (header) {
            // move the child into the fragment
            fragment.appendChild(header);
        }
    })

    // add the elements back in, now in the correct order
    headerRow.appendChild(fragment);
    tasks.forEach(t => t.updateColSpan());
}

document.addEventListener("DOMContentLoaded", () => {
    cellWidth = window.getComputedStyle(document.documentElement).getPropertyValue('--cell-width');

    const thMonths = document.querySelectorAll(".month");
    const weeks = document.querySelector(".weeks");

    // add the week headings
    for (let i = 0; i < thMonths.length; i++) {
        for (let i = 0; i < 4; i++) {
            const w = document.createElement("th");
            w.classList.add("week");
            w.innerText = "W" + (i+1);
            weeks.appendChild(w);
        }
    }

    const weeksCheckbox = document.getElementById("weeks");
    weeksCheckbox.addEventListener("input", (e) => setWeeksMode(e.target.checked));
    setWeeksMode(weeksCheckbox.checked);

    document.getElementById("same").addEventListener("input", (e) => {
        if (e.target.checked) {
            tasks.forEach(t => t.colour = document.getElementById("sameColour").value);
        }
    })
    document.getElementById("random").addEventListener("input", (e) => {
        if (e.target.checked) {
            tasks.forEach(t => t.colour = randomHexColour());
        }
    })
    document.getElementById("sameColour").addEventListener("input", () => {
        if (document.getElementById("same").checked) {
            tasks.forEach(t => t.colour = document.getElementById("sameColour").value);
        }
    })

    document.getElementById("nameInBox").addEventListener("input", (e) => {
        if (e.target.checked) {
            tasks.forEach(t => t.showName());
        } else {
            tasks.forEach(t => t.hideName());
        }
    })

    document.getElementById("startMonth").addEventListener("input", (e) => setStartMonth(e.target.value))
    if (urlParams.get("startMonth")) {
        document.getElementById("startMonth").value = urlParams.get("startMonth");
        setStartMonth(urlParams.get("startMonth"));
    }

    loadTasksFromUrl();

})
