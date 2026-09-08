```javascript
/* =========================================================
   GRAPHX 3D
   Interactive 3D Mathematical Graph Visualizer
========================================================= */


/* =========================================================
   DOM ELEMENTS
========================================================= */

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

const displayEquation = document.getElementById("displayEquation");

const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

const errorMessage = document.getElementById("errorMessage");


/* =========================================================
   THREE.JS VARIABLES
========================================================= */

let scene;
let camera;
let renderer;
let controls;

let surfaceGroup = null;

let axesGroup = null;
let gridGroup = null;

let animationId = null;

let isRunning = false;
let isPaused = false;
let isFinished = false;


/* =========================================================
   GRAPH DATA
========================================================= */

let graphData = [];

let currentRow = 0;

let totalRows = 0;

let currentPoint = 0;

let totalPoints = 0;

let compiledEquation = null;

let graphSettings = {};


/* =========================================================
   INITIALIZE THREE.JS
========================================================= */

function initThree() {

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x070b14);


    /* CAMERA */

    camera = new THREE.PerspectiveCamera(
        50,
        graphContainer.clientWidth /
            graphContainer.clientHeight,
        0.1,
        1000
    );

    camera.position.set(
        10,
        9,
        12
    );


    /* RENDERER */

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
        graphContainer.clientWidth,
        graphContainer.clientHeight
    );

    graphContainer.appendChild(renderer.domElement);


    /* ORBIT CONTROLS */

    controls = new THREE.OrbitControls(
        camera,
        renderer.domElement
    );

    controls.enableDamping = true;

    controls.dampingFactor = 0.08;

    controls.minDistance = 3;

    controls.maxDistance = 60;

    controls.target.set(0, 0, 0);


    /* LIGHTING */

    const ambientLight = new THREE.AmbientLight(
        0xffffff,
        0.7
    );

    scene.add(ambientLight);


    const directionalLight =
        new THREE.DirectionalLight(
            0xffffff,
            0.9
        );

    directionalLight.position.set(
        8,
        15,
        10
    );

    scene.add(directionalLight);


    /* AXES */

    createAxes();

    /* GRID */

    createGrid();


    /* RESIZE */

    window.addEventListener(
        "resize",
        resizeRenderer
    );


    animate();

}


/* =========================================================
   CREATE AXES
========================================================= */

function createAxes() {

    axesGroup = new THREE.Group();


    const axisLength = 10;


    /* X AXIS */

    const xMaterial =
        new THREE.LineBasicMaterial({
            color: 0xff5555
        });

    const xGeometry =
        new THREE.BufferGeometry().setFromPoints([
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

    axesGroup.add(xAxis);


    /* Y AXIS */

    const yMaterial =
        new THREE.LineBasicMaterial({
            color: 0x55ddff
        });

    const yGeometry =
        new THREE.BufferGeometry().setFromPoints([
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

    axesGroup.add(yAxis);


    /* Z AXIS */

    const zMaterial =
        new THREE.LineBasicMaterial({
            color: 0x66ee88
        });

    const zGeometry =
        new THREE.BufferGeometry().setFromPoints([
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

    axesGroup.add(zAxis);


    scene.add(axesGroup);
}


/* =========================================================
   CREATE GRID
========================================================= */

function createGrid() {

    gridGroup = new THREE.Group();


    const size = 20;

    const divisions = 20;


    const grid = new THREE.GridHelper(
        size,
        divisions,
        0x33445d,
        0x1a2638
    );


    /*
        Three.js GridHelper is horizontal.

        We use:
        X = world X
        Y = world Z
        Z = world Y
    */

    gridGroup.add(grid);

    scene.add(gridGroup);
}


/* =========================================================
   CONVERT GRAPH COORDINATES
========================================================= */

/*
    Mathematics:

        x → world X
        y → world Z
        z → world Y

    This makes the mathematical Z axis
    point upward in the 3D scene.
*/

function graphToWorld(x, y, z) {

    return new THREE.Vector3(
        x,
        z,
        y
    );
}


/* =========================================================
   COMPILE EQUATION
========================================================= */

function compileGraphEquation(expression) {

    try {

        return math.compile(
            expression
        );

    } catch (error) {

        throw new Error(
            "Invalid mathematical expression."
        );

    }

}


/* =========================================================
   CALCULATE Z
========================================================= */

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


        /*
            Prevent extremely large values
            from destroying the camera.
        */

        if (Math.abs(result) > 1000) {

            return null;

        }


        return result;

    } catch (error) {

        return null;

    }

}


/* =========================================================
   BUILD GRAPH DATA
========================================================= */

function buildGraphData() {

    const xmin =
        parseFloat(xminInput.value);

    const xmax =
        parseFloat(xmaxInput.value);

    const ymin =
        parseFloat(yminInput.value);

    const ymax =
        parseFloat(ymaxInput.value);

    const resolution =
        parseInt(resolutionInput.value);


    if (
        !Number.isFinite(xmin) ||
        !Number.isFinite(xmax) ||
        !Number.isFinite(ymin) ||
        !Number.isFinite(ymax)
    ) {

        throw new Error(
            "Please enter valid graph ranges."
        );

    }


    if (
        xmin >= xmax ||
        ymin >= ymax
    ) {

        throw new Error(
            "Minimum values must be smaller than maximum values."
        );

    }


    graphSettings = {
        xmin,
        xmax,
        ymin,
        ymax,
        resolution
    };


    graphData = [];

    totalPoints = 0;


    for (let row = 0; row <= resolution; row++) {

        const y =
            ymin +
            (row / resolution) *
            (ymax - ymin);


        const points = [];


        for (let col = 0; col <= resolution; col++) {

            const x =
                xmin +
                (col / resolution) *
                (xmax - xmin);


            const z =
                calculateZ(x, y);


            points.push({
                x,
                y,
                z
            });


            if (z !== null) {

                totalPoints++;

            }

        }


        graphData.push(points);

    }


    totalRows = graphData.length;

}


/* =========================================================
   CREATE SURFACE
========================================================= */

function createSurface() {

    if (surfaceGroup) {

        scene.remove(surfaceGroup);

    }


    surfaceGroup =
        new THREE.Group();


    scene.add(surfaceGroup);

}


/* =========================================================
   DRAW ONE ROW
========================================================= */

function drawRow(rowIndex) {

    if (
        rowIndex < 0 ||
        rowIndex >= graphData.length
    ) {

        return;

    }


    const row =
        graphData[rowIndex];


    const validPoints =
        row.filter(
            point =>
                point.z !== null
        );


    if (validPoints.length < 2) {

        return;

    }


    /*
        DRAW THE ROW AS A LINE
    */

    const linePoints =
        validPoints.map(point =>

            graphToWorld(
                point.x,
                point.y,
                point.z
            )

        );


    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints(linePoints);


    const material =
        new THREE.LineBasicMaterial({
            color: 0x5ee7ff
        });


    const line =
        new THREE.Line(
            geometry,
            material
        );


    surfaceGroup.add(line);


    /*
        CONNECT THIS ROW TO THE PREVIOUS ROW
        TO CREATE THE SURFACE.
    */

    if (rowIndex > 0) {

        const previousRow =
            graphData[rowIndex - 1];


        const segments = [];


        for (
            let col = 0;
            col < row.length - 1;
            col++
        ) {

            const a =
                row[col];

            const b =
                row[col + 1];

            const c =
                previousRow[col];

            const d =
                previousRow[col + 1];


            if (
                a.z === null ||
                b.z === null ||
                c.z === null ||
                d.z === null
            ) {

                continue;

            }


            /*
                Triangle 1
            */

            segments.push(
                graphToWorld(
                    a.x,
                    a.y,
                    a.z
                )
            );

            segments.push(
                graphToWorld(
                    b.x,
                    b.y,
                    b.z
                );

            );


            /*
                Triangle 2
            */

            segments.push(
                graphToWorld(
                    b.x,
                    b.y,
                    b.z
                )
            );

            segments.push(
                graphToWorld(
                    d.x,
                    d.y,
                    d.z
                )
            );


            segments.push(
                graphToWorld(
                    d.x,
                    d.y,
                    d.z
                )
            );

            segments.push(
                graphToWorld(
                    c.x,
                    c.y,
                    c.z
                )
            );


            segments.push(
                graphToWorld(
                    c.x,
                    c.y,
                    c.z
                )
            );

            segments.push(
                graphToWorld(
                    a.x,
                    a.y,
                    a.z
                )
            );

        }


        if (segments.length > 0) {

            const surfaceGeometry =
                new THREE.BufferGeometry()
                    .setFromPoints(
                        segments
                    );


            const surfaceMaterial =
                new THREE.LineBasicMaterial({
                    color: 0x4f78a8,
                    transparent: true,
                    opacity: 0.35
                });


            const surfaceLines =
                new THREE.LineSegments(
                    surfaceGeometry,
                    surfaceMaterial
                );


            surfaceGroup.add(
                surfaceLines
            );

        }

    }

}


/* =========================================================
   DRAW GRAPH PROGRESSIVELY
========================================================= */

function animateGraph() {

    if (!isRunning || isPaused) {

        return;

    }


    const speed =
        parseInt(speedInput.value);


    /*
        Higher speed = more rows per frame.
    */

    const rowsPerFrame =
        speed;


    for (
        let i = 0;
        i < rowsPerFrame;
        i++
    ) {

        if (
            currentRow >= totalRows
        ) {

            finishGraph();

            return;

        }


        drawRow(currentRow);


        const row =
            graphData[currentRow];


        /*
            Find latest valid point.
        */

        for (
            let j = 0;
            j < row.length;
            j++
        ) {

            const point = row[j];

            if (point.z !== null) {

                xValue.textContent =
                    point.x.toFixed(2);

                yValue.textContent =
                    point.y.toFixed(2);

                zValue.textContent =
                    point.z.toFixed(2);

                break;

            }

        }


        currentPoint +=
            row.filter(
                point =>
                    point.z !== null
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
            currentPoint.toLocaleString();

    }

}


/* =========================================================
   FINISH
========================================================= */

function finishGraph() {

    isRunning = false;

    isPaused = false;

    isFinished = true;


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


    cancelAnimationFrame(
        animationId
    );

}


/* =========================================================
   MAIN ANIMATION LOOP
========================================================= */

function animate() {

    animationId =
        requestAnimationFrame(
            animate
        );


    controls.update();

    animateGraph();


    renderer.render(
        scene,
        camera
    );

}


/* =========================================================
   RUN GRAPH
========================================================= */

function runGraph() {

    hideError();


    try {

        const expression =
            equationInput.value.trim();


        if (!expression) {

            throw new Error(
                "Enter an equation first."
            );

        }


        /*
            Allow users to enter:
                z = x^2 + y^2

            or:
                x^2 + y^2
        */

        let cleanExpression =
            expression;


        if (
            cleanExpression
                .toLowerCase()
                .startsWith("z=")
        ) {

            cleanExpression =
                cleanExpression
                    .substring(2)
                    .trim();

        }


        compiledEquation =
            compileGraphEquation(
                cleanExpression
            );


        buildGraphData();

        createSurface();


        currentRow = 0;

        currentPoint = 0;

        isRunning = true;

        isPaused = false;

        isFinished = false;


        displayEquation.textContent =
            "z = " +
            formatEquation(
                cleanExpression
            );


        progressText.textContent =
            "0%";

        progressFill.style.width =
            "0%";

        pointsText.textContent =
            "0";


        statusText.textContent =
            "Generating...";

        statusDot.style.background =
            "#5ee7ff";

        statusDot.style.boxShadow =
            "0 0 12px #5ee7ff";


    } catch (error) {

        showError(
            error.message
        );

    }

}


/* =========================================================
   PAUSE
========================================================= */

function pauseGraph() {

    if (!isRunning) {

        return;

    }


    isPaused = !isPaused;


    if (isPaused) {

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


/* =========================================================
   RESET
========================================================= */

function resetGraph() {

    isRunning = false;

    isPaused = false;

    isFinished = false;


    currentRow = 0;

    currentPoint = 0;


    if (surfaceGroup) {

        scene.remove(
            surfaceGroup
        );

        surfaceGroup = null;

    }


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


/* =========================================================
   FORMAT EQUATION
========================================================= */

function formatEquation(expression) {

    return expression
        .replace(/\*\*/g, "^")
        .replace(/\^2/g, "²")
        .replace(/\^3/g, "³");

}


/* =========================================================
   ERROR HANDLING
========================================================= */

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


    setTimeout(() => {

        hideError();

    }, 4000);

}


function hideError() {

    errorMessage.style.display =
        "none";

}


/* =========================================================
   RESIZE
========================================================= */

function resizeRenderer() {

    if (!renderer) {

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


/* =========================================================
   UI EVENTS
========================================================= */

runBtn.addEventListener(
    "click",
    runGraph
);


pauseBtn.addEventListener(
    "click",
    pauseGraph
);


resetBtn.addEventListener(
    "click",
    resetGraph
);


/* Enter key */

equationInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            runGraph();

        }

    }
);


/* Resolution */

resolutionInput.addEventListener(
    "input",
    () => {

        resolutionValue.textContent =
            resolutionInput.value;

    }
);


/* Speed */

speedInput.addEventListener(
    "input",
    () => {

        speedValue.textContent =
            speedInput.value + "x";

    }
);


/* Example equations */

document
    .querySelectorAll(
        ".examples button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                equationInput.value =
                    button.dataset.equation;

                runGraph();

            }
        );

    });


/* =========================================================
   START APPLICATION
========================================================= */

initThree();

/*
    Do not automatically generate the graph.
    The user presses Run.
*/
```
