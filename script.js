var cellWidth = "16px";
var tableHeaderX = [];
var currentSlider = null;

let weeksMode = true;
let tasks = [];

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

document.addEventListener("DOMContentLoaded", () => {
    cellWidth = window.getComputedStyle(document.documentElement).getPropertyValue('--cell-width');

    const months = document.querySelectorAll(".month");
    const weeks = document.querySelector(".weeks");

    // add the week headings
    for (let i = 0; i < months.length; i++) {
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
})


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
    static months = [
        "january", "february", "march", "april", "may", "june", 
        "july", "august", "september", "october", "november", "december"
    ];
    
    constructor(row, startMonth, startWeek, endMonth, endWeek) {
        this.row = row;
        this.startMonth = startMonth;
        this.startWeek = startWeek;
        this.endMonth = endMonth;
        this.endWeek = endWeek;
        this.colour = newTaskColour();

        if (!weeksMode) {
            const weekControls = this.row.querySelectorAll(".weekControl");
            for (let e of weekControls) {
                e.classList.add("hidden");
            }
        }

        row.querySelector(".removeBtn").addEventListener("click", () => {
            const index = tasks.indexOf(this);
            tasks.splice(index, 1);

            this.row.remove();
        });

        row.querySelector(".startMonth").addEventListener("input", (e) => this.startMonth = e.target.value);
        row.querySelector(".startWeek").addEventListener("input", (e) => this.startWeek = e.target.value);
        row.querySelector(".endMonth").addEventListener("input", (e) => this.endMonth = e.target.value);
        row.querySelector(".endWeek").addEventListener("input", (e) => this.endWeek = e.target.value);
        row.querySelector(".colour").addEventListener("input", (e) => this.colour = e.target.value);
        row.querySelector(".taskName").addEventListener("input", (e) => this.name = e.target.value);
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
        console.log("setting name to:", value);
        this.row.querySelector(".taskName").value = value;
        this.row.querySelector(".taskLength").innerText = value;
    }

    get colour() {
        return this.row.querySelector(".colour").value;
    }
    set colour(value) {
        this.row.querySelector(".colour").value = value;
        this.row.querySelector(".taskLength").style.background = value;
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
    }

    get startWeek() {
        if (weeksMode) {
            return Number.parseInt(this.row.querySelector(".startWeek").value) - 1;
        }
        return 0;
    }
    set startWeek(n) {
        this.row.querySelector(".startWeek").value = n;

        const { startMonthIndex, endMonthIndex } = this.getMonthIndexes();
        if (startMonthIndex === endMonthIndex) {
            if (n > this.endWeek) {
                this.row.querySelector(".endWeek").value = n;
            }
        }

        this.updateColSpan();
    }

    get endWeek() {
        if (weeksMode) {
            return Number.parseInt(this.row.querySelector(".endWeek").value);
        }
        return 0;
    }
    set endWeek(n) {
        this.row.querySelector(".endWeek").value = n;

        const { startMonthIndex, endMonthIndex } = this.getMonthIndexes();
        if (startMonthIndex === endMonthIndex) {
            if (n < this.startWeek) {
                this.row.querySelector(".startWeek").value = n;
            }
        }

        this.updateColSpan();
    }



    getMonthIndexes() {
        return {
            startMonthIndex: this.constructor.months.indexOf(this.startMonth),
            endMonthIndex: this.constructor.months.indexOf(this.endMonth),
        }
    }

    updateColSpan() {
        const { startMonthIndex, endMonthIndex } = this.getMonthIndexes();

        const empties = this.row.querySelectorAll(".empty");
        console.log(this.startWeek);
        const requiredEmpties = startMonthIndex * getMonthWidth() + this.startWeek;
        if (empties.length > requiredEmpties) {
            console.log("removing empties", empties.length, "vs", requiredEmpties);
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
            console.log("adding empties", empties.length, "to", requiredEmpties);
            for (let i = 0; i < toAdd; i++) {
                const td = document.createElement("td");
                td.classList.add("empty");
                const taskLength = this.row.querySelector(".taskLength");
                this.row.insertBefore(td, taskLength);
            }
        }

        const taskLength = this.row.querySelector(".taskLength");
        const colspan = Math.max(1,
            (endMonthIndex - startMonthIndex + (weeksMode ? 0 : 1)) * getMonthWidth() + this.endWeek - this.startWeek
        );
        console.log("colspan:", colspan, "endWeek:", this.endWeek);
        taskLength.colSpan = colspan;
        taskLength.style.display = "none";
        setTimeout(() => {
            taskLength.style.display = "table-cell";
        }, 0);
    }
}

if ("content" in document.createElement("template")) {
    // browser supports <template>

    function growRight(row, task) {
        console.log(row, task);
    }

    function addTask() {
        const tbody = document.querySelector("tbody");
        const rowTemplate = document.querySelector("#rowTemplate");
        const clone = rowTemplate.content.cloneNode(true);
        const row = tbody.appendChild(clone.querySelector("tr")); // add the tr from the clone, not the whole template

        const taskName = "task" + (tasks.length + 1);

        const task = new Task(row, "january", 1, "january", 1)
        task.name = taskName;
        tasks.push(task);
    }
}
