// ============================================================
// GRAPHX 3D - WORKING VERSION
// ============================================================

const graphContainer = document.getElementById("graph");

const equationInput = document.getElementById("equation");

const xminInput = document.getElementById("xmin");
const xmaxInput = document.getElementById("xmax");
const yminInput = document.getElementById("ymin");
const ymaxInput = document.getElementById("ymax");

const resolutionInput = document.getElementById("resolution");
const resolutionValue = document.getElementById("resolutionValue");

const speedInput = document.getElementById("speed");
const speedValue = document.getElementById("speedValue");

const runBtn = document.getElementById("runBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");

const xValue = document.getElementById("xValue");
const yValue = document.getElementById("yValue");
const zValue = document.getElementById("zValue");

const pointsText = document.getElementById("pointsText");

const displayEquation =
    document.getElementById("displayEquation");

const statusText =
    document.getElementById("statusText");

const statusDot =
    document.getElementById("statusDot");

const errorMessage =
    document.getElementById("errorMessage");


// ============================================================
// THREE.JS VARIABLES
// ============================================================

let scene;
let camera;
let renderer;
let controls;

let graphGroup = null;

let compiledEquation = null;

let graphRows = [];

let currentRow = 0;

let totalRows = 0;

let totalPoints = 0;

let generatedPoints = 0;

let running = false;

let paused = false;


// ============================================================
// INITIALIZE
// ============================================================

function init() {

    console.log("GraphX 3D starting...");

    if (typeof THREE === "undefined") {

        showError(
            "Three.js failed to load. Check your internet connection."
        );

        return;
    }

    if (typeof math === "undefined") {

        showError(
            "Math.js failed to load. Check your internet connection."
        );

        return;
    }


    // --------------------------------------------------------
    // SCENE
    // --------------------------------------------------------

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x070b14);


    // --------------------------------------------------------
    // CAMERA
    // --------------------------------------------------------

    camera =
        new THREE.PerspectiveCamera(
            45,
            graphContainer.clientWidth /
            graphContainer.clientHeight,
            0.1,
            1000
        );


    camera.position.set(
        12,
        10,
        14
    );


    // --------------------------------------------------------
    // RENDERER
    // --------------------------------------------------------

    renderer =
        new THREE.WebGLRenderer({
            antialias: true
        });


    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );


    renderer.setSize(
        graphContainer.clientWidth,
        graphContainer.clientHeight
    );


    graphContainer.appendChild(
        renderer.domElement
    );


    // --------------------------------------------------------
    // CONTROLS
    // --------------------------------------------------------

    if (typeof THREE.OrbitControls !== "undefined") {

        controls =
            new THREE.OrbitControls(
                camera,
                renderer.domElement
            );

        controls.enableDamping = true;

        controls.dampingFactor = 0.08;

        controls.minDistance = 3;

        controls.maxDistance = 100;

        controls.target.set(
            0,
            0,
            0
        );
    }


    // --------------------------------------------------------
    // LIGHTS
    // --------------------------------------------------------

    const ambient =
        new THREE.AmbientLight(
            0xffffff,
            0.8
        );

    scene.add(ambient);


    const directional =
        new THREE.DirectionalLight(
            0xffffff,
            1
        );

    directional.position.set(
        10,
        20,
        10
    );

    scene.add(directional);


    // --------------------------------------------------------
    // AXES
    // --------------------------------------------------------

    createAxes();


    // --------------------------------------------------------
    // GRID
    // --------------------------------------------------------

    createGrid();


    // --------------------------------------------------------
    // RESIZE
    // --------------------------------------------------------

    window.addEventListener(
        "resize",
        resize
    );


    // --------------------------------------------------------
    // START RENDER LOOP
    // --------------------------------------------------------

    render();


    console.log(
        "GraphX 3D initialized successfully."
    );

}


// ============================================================
// AXES
// ============================================================

function createAxes() {

    const axisLength = 10;


    // X AXIS - RED

    const xMaterial =
        new THREE.LineBasicMaterial({
            color: 0xff4444
        });


    const xGeometry =
        new THREE.BufferGeometry()
            .setFromPoints([
                new THREE.Vector3(
                    -axisLength,
                    0,
                    0
                ),

                new THREE.Vector3(
                    axisLength,
                    0,
                    0
                )
            ]);


    const xAxis =
        new THREE.Line(
            xGeometry,
            xMaterial
        );


    scene.add(xAxis);


    // Y AXIS - BLUE

    const yMaterial =
        new THREE.LineBasicMaterial({
            color: 0x44ccff
        });


    const yGeometry =
        new THREE.BufferGeometry()
            .setFromPoints([
                new THREE.Vector3(
                    0,
                    0,
                    -axisLength
                ),

                new THREE.Vector3(
                    0,
                    0,
                    axisLength
                )
            ]);


    const yAxis =
        new THREE.Line(
            yGeometry,
            yMaterial
        );


    scene.add(yAxis);


    // Z AXIS - GREEN

    const zMaterial =
        new THREE.LineBasicMaterial({
            color: 0x55ee88
        });


    const zGeometry =
        new THREE.BufferGeometry()
            .setFromPoints([
                new THREE.Vector3(
                    0,
                    -axisLength,
                    0
                ),

                new THREE.Vector3(
                    0,
                    axisLength,
                    0
                )
            ]);


    const zAxis =
        new THREE.Line(
            zGeometry,
            zMaterial
        );


    scene.add(zAxis);

}


// ============================================================
// GRID
// ============================================================

function createGrid() {

    const grid =
        new THREE.GridHelper(
            20,
            20,
            0x557799,
            0x223044
        );


    scene.add(grid);

}


// ============================================================
// GRAPH COORDINATE CONVERSION
// ============================================================
//
// Math:
//
// X → Three.js X
// Y → Three.js Z
// Z → Three.js Y
//
// This makes mathematical Z point upward.
// ============================================================

function toWorld(x, y, z) {

    return new THREE.Vector3(
        x,
        z,
        y
    );

}


// ============================================================
// GET EQUATION
// ============================================================

function cleanEquation(expression) {

    expression =
        expression.trim();


    // Remove "z =" if user typed it

    if (
        expression
            .toLowerCase()
            .startsWith("z=")
    ) {

        expression =
            expression.substring(2)
                .trim();

    }


    return expression;

}


// ============================================================
// CALCULATE Z
// ============================================================

function calculateZ(x, y) {

    try {

        const result =
            compiledEquation.evaluate({
                x: x,
                y: y
            });


        if (
            typeof result !== "number" ||
            !Number.isFinite(result)
        ) {

            return null;

        }


        // Ignore absurd values

        if (
            Math.abs(result) > 100
        ) {

            return null;

        }


        return result;

    } catch (error) {

        return null;

    }

}


// ============================================================
// BUILD GRAPH DATA
// ============================================================

function buildGraph() {

    const xmin =
        parseFloat(
            xminInput.value
        );

    const xmax =
        parseFloat(
            xmaxInput.value
        );

    const ymin =
        parseFloat(
            yminInput.value
        );

    const ymax =
        parseFloat(
            ymaxInput.value
        );

    const resolution =
        parseInt(
            resolutionInput.value
        );


    if (
        xmin >= xmax ||
        ymin >= ymax
    ) {

        throw new Error(
            "Minimum must be smaller than maximum."
        );

    }


    graphRows = [];

    totalPoints = 0;

    generatedPoints = 0;


    // --------------------------------------------------------
    // CALCULATE EVERY POINT
    // --------------------------------------------------------

    for (
        let row = 0;
        row <= resolution;
        row++
    ) {

        const y =
            ymin +
            (row / resolution) *
            (ymax - ymin);


        const points = [];


        for (
            let col = 0;
            col <= resolution;
            col++
        ) {

            const x =
                xmin +
                (col / resolution) *
                (xmax - xmin);


            const z =
                calculateZ(
                    x,
                    y
                );


            points.push({
                x: x,
                y: y,
                z: z
            });


            if (z !== null) {

                totalPoints++;

            }

        }


        graphRows.push(
            points
        );

    }


    totalRows =
        graphRows.length;

}


// ============================================================
// CREATE GRAPH GROUP
// ============================================================

function clearGraph() {

    if (graphGroup) {

        scene.remove(
            graphGroup
        );


        graphGroup.traverse(
            object => {

                if (object.geometry) {

                    object.geometry.dispose();

                }

                if (object.material) {

                    object.material.dispose();

                }

            }
        );

    }


    graphGroup =
        new THREE.Group();


    scene.add(
        graphGroup
    );

}


// ============================================================
// DRAW ONE ROW
// ============================================================

function drawRow(rowIndex) {

    const row =
        graphRows[rowIndex];


    if (!row) {

        return;

    }


    const valid =
        row.filter(
            p => p.z !== null
        );


    if (valid.length < 2) {

        return;

    }


    // --------------------------------------------------------
    // DRAW ROW LINE
    // --------------------------------------------------------

    const linePoints =
        valid.map(
            p =>
                toWorld(
                    p.x,
                    p.y,
                    p.z
                )
        );


    const lineGeometry =
        new THREE.BufferGeometry()
            .setFromPoints(
                linePoints
            );


    const lineMaterial =
        new THREE.LineBasicMaterial({
            color: 0x5ee7ff
        });


    const line =
        new THREE.Line(
            lineGeometry,
            lineMaterial
        );


    graphGroup.add(
        line
    );


    // --------------------------------------------------------
    // CONNECT WITH PREVIOUS ROW
    // --------------------------------------------------------

    if (rowIndex === 0) {

        return;

    }


    const previous =
        graphRows[
            rowIndex - 1
        ];


    const vertices = [];


    for (
        let col = 0;
        col < row.length;
        col++
    ) {

        const current =
            row[col];

        const old =
            previous[col];


        if (
            !current ||
            !old ||
            current.z === null ||
            old.z === null
        ) {

            continue;

        }


        vertices.push(
            toWorld(
                current.x,
                current.y,
                current.z
            )
        );


        vertices.push(
            toWorld(
                old.x,
                old.y,
                old.z
            )
        );

    }


    if (vertices.length === 0) {

        return;

    }


    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints(
                vertices
            );


    const material =
        new THREE.LineBasicMaterial({
            color: 0x42688f,
            transparent: true,
            opacity: 0.7
        });


    const connections =
        new THREE.LineSegments(
            geometry,
            material
        );


    graphGroup.add(
        connections
    );

}


// ============================================================
// ANIMATE GRAPH
// ============================================================

function updateGraphAnimation() {

    if (
        !running ||
        paused
    ) {

        return;

    }


    const speed =
        parseInt(
            speedInput.value
        );


    for (
        let i = 0;
        i < speed;
        i++
    ) {

        if (
            currentRow >= totalRows
        ) {

            finish();

            return;

        }


        drawRow(
            currentRow
        );


        const row =
            graphRows[
                currentRow
            ];


        // Update live coordinates

        for (
            let i = row.length - 1;
            i >= 0;
            i--
        ) {

            const p =
                row[i];


            if (
                p.z !== null
            ) {

                xValue.textContent =
                    p.x.toFixed(2);

                yValue.textContent =
                    p.y.toFixed(2);

                zValue.textContent =
                    p.z.toFixed(2);

                break;

            }

        }


        generatedPoints +=
            row.filter(
                p => p.z !== null
            ).length;


        currentRow++;


        const progress =
            (
                currentRow /
                totalRows
            ) * 100;


        progressText.textContent =
            Math.round(progress) + "%";


        progressFill.style.width =
            progress + "%";


        pointsText.textContent =
            generatedPoints.toLocaleString();

    }

}


// ============================================================
// RUN
// ============================================================

function runGraph() {

    hideError();


    try {

        let expression =
            equationInput.value;


        expression =
            cleanEquation(
                expression
            );


        if (!expression) {

            throw new Error(
                "Please enter an equation."
            );

        }


        // Compile equation

        compiledEquation =
            math.compile(
                expression
            );


        // Test equation

        const test =
            compiledEquation.evaluate({
                x: 1,
                y: 1
            });


        if (
            typeof test !== "number" ||
            !Number.isFinite(test)
        ) {

            throw new Error(
                "The equation must produce a numerical Z value."
            );

        }


        // Build graph

        buildGraph();


        // Clear previous graph

        clearGraph();


        currentRow = 0;

        generatedPoints = 0;

        running = true;

        paused = false;


        displayEquation.textContent =
            "z = " +
            formatEquation(
                expression
            );


        progressText.textContent =
            "0%";


        progressFill.style.width =
            "0%";


        pointsText.textContent =
            "0";


        pauseBtn.textContent =
            "⏸ Pause";


        statusText.textContent =
            "Generating...";


        statusDot.style.background =
            "#5ee7ff";


        statusDot.style.boxShadow =
            "0 0 12px #5ee7ff";


        console.log(
            "Graph generation started:",
            expression
        );

    } catch (error) {

        console.error(
            error
        );


        showError(
            error.message
        );

    }

}


// ============================================================
// PAUSE / RESUME
// ============================================================

function togglePause() {

    if (!running) {

        return;

    }


    paused =
        !paused;


    if (paused) {

        pauseBtn.textContent =
            "▶ Resume";


        statusText.textContent =
            "Paused";


        statusDot.style.background =
            "#ffc857";


        statusDot.style.boxShadow =
            "0 0 12px #ffc857";

    } else {

        pauseBtn.textContent =
            "⏸ Pause";


        statusText.textContent =
            "Generating...";


        statusDot.style.background =
            "#5ee7ff";


        statusDot.style.boxShadow =
            "0 0 12px #5ee7ff";

    }

}


// ============================================================
// RESET
// ============================================================

function resetGraph() {

    running = false;

    paused = false;

    currentRow = 0;

    generatedPoints = 0;


    clearGraph();


    progressText.textContent =
        "0%";


    progressFill.style.width =
        "0%";


    pointsText.textContent =
        "0";


    xValue.textContent =
        "0.00";


    yValue.textContent =
        "0.00";


    zValue.textContent =
        "0.00";


    pauseBtn.textContent =
        "⏸ Pause";


    statusText.textContent =
        "Ready";


    statusDot.style.background =
        "#45e08a";


    statusDot.style.boxShadow =
        "0 0 12px #45e08a";

}


// ============================================================
// FINISH
// ============================================================

function finish() {

    running = false;

    paused = false;


    statusText.textContent =
        "Complete";


    statusDot.style.background =
        "#45e08a";


    statusDot.style.boxShadow =
        "0 0 12px #45e08a";


    progressText.textContent =
        "100%";


    progressFill.style.width =
        "100%";

}


// ============================================================
// FORMAT EQUATION
// ============================================================

function formatEquation(expression) {

    return expression
        .replace(/\*\*/g, "^")
        .replace(/\^2/g, "²")
        .replace(/\^3/g, "³");

}


// ============================================================
// ERROR
// ============================================================

function showError(message) {

    errorMessage.textContent =
        message;


    errorMessage.style.display =
        "block";


    statusText.textContent =
        "Error";


    statusDot.style.background =
        "#ff5968";


    statusDot.style.boxShadow =
        "0 0 12px #ff5968";

}


function hideError() {

    errorMessage.style.display =
        "none";

}


// ============================================================
// RESIZE
// ============================================================

function resize() {

    if (
        !renderer ||
        !camera
    ) {

        return;

    }


    const width =
        graphContainer.clientWidth;


    const height =
        graphContainer.clientHeight;


    camera.aspect =
        width / height;


    camera.updateProjectionMatrix();


    renderer.setSize(
        width,
        height
    );

}


// ============================================================
// RENDER LOOP
// ============================================================

function render() {

    requestAnimationFrame(
        render
    );


    updateGraphAnimation();


    if (controls) {

        controls.update();

    }


    renderer.render(
        scene,
        camera
    );

}


// ============================================================
// UI EVENTS
// ============================================================

runBtn.addEventListener(
    "click",
    runGraph
);


pauseBtn.addEventListener(
    "click",
    togglePause
);


resetBtn.addEventListener(
    "click",
    resetGraph
);


equationInput.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter"
        ) {

            runGraph();

        }

    }
);


resolutionInput.addEventListener(
    "input",
    function() {

        resolutionValue.textContent =
            resolutionInput.value;

    }
);


speedInput.addEventListener(
    "input",
    function() {

        speedValue.textContent =
            speedInput.value + "x";

    }
);


// ============================================================
// EXAMPLE BUTTONS
// ============================================================

document
    .querySelectorAll(
        ".examples button"
    )
    .forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    equationInput.value =
                        button.dataset.equation;


                    runGraph();

                }
            );

        }
    );


// ============================================================
// START
// ============================================================

init();
