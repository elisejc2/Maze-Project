// ELISE
//js library = brm.io/matter-js = used to draw things on screen 
//world = object that contains all the different 'things' in our matter app


const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cellsHorizontal = 6;
const cellsVertical = 4;
const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();

const { world } = engine;
engine.world.gravity.y = 0; //dsiables gravity on y axis
const render = Render.create({
    element: document.body, 
    engine: engine,
    options: {
        wireframes: false,
        width: width,
        height: height,
    }
});
Render.run(render);
Runner.run(Runner.create(), engine);

// WALLS
const walls = [
    //(x, y, w, h) (order: top, bottom, left, right)
    Bodies.rectangle(width / 2, 0, width, 2, {isStatic: true}),
    Bodies.rectangle(width / 2, height, width, 2, {isStatic: true}),
    Bodies.rectangle(0,height / 2, 2 ,height, {isStatic: true}),
    Bodies.rectangle(width, height / 2, 2, height, {isStatic: true})
];
World.add(world, walls);

// ***** MAZE GENERATION ******

//arr = array 
const shuffle = (arr) => {
    let counter = arr.length;
    while (counter > 0) {
        const index = Math.floor(Math.random() * counter);
        counter--;

        //temp = temporary
        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }
    return arr
};

//  ***** GRID *****

const grid = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal)
    .fill(false));

const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1)
    .fill(false));

const horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal)
    .fill(false));


//***** PICKING RANDOM STARTING POINT FOR MAZE *****
const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, column) => {
    if (grid[row][column]) {
        return;
    }
    grid[row][column] = true;

    const neighbors = shuffle([
        [row - 1, column, 'up'],
        [row, column + 1, 'right'],
        [row + 1, column, 'down'],
        [row, column - 1, 'left']
    ]);

    for (let neighbor of neighbors) {
        const [nextRow, nextColumn, direction] = neighbor;
        if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
            continue;
        }
        if (grid[nextRow][nextColumn]) {
            continue;
        }
        if (direction === 'left') {
            verticals[row][column - 1] = true;
        } else if (direction === 'right') {
            verticals[row][column] = true;
        } else if (direction === 'up') {
            horizontals[row - 1][column] = true;
        } else if (direction === 'down') {
            horizontals[row][column] = true;
        }
        
        stepThroughCell(nextRow, nextColumn);
    }
};

stepThroughCell(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if(open) {
            return;
        }

        const wall = Bodies.rectangle(
            // (x,y,w,length)
            columnIndex * unitLengthX + (unitLengthX / 2),
            rowIndex * unitLengthY + unitLengthY,
            unitLengthX, 
            5,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'pink'
                }
            }
        );
        World.add(world, wall);
    });

});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if(open) {
            return;
        }

        const wall = Bodies.rectangle(
            // (x,y,w,h)
            columnIndex * unitLengthX + unitLengthX,
            rowIndex * unitLengthY + (unitLengthY / 2),
            5,
            unitLengthY,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'pink'
                }
            }
        );
        World.add(world, wall);
    });
});

// ***** GOAL *****
const goal = Bodies.rectangle(
    width - (unitLengthX / 2),
    height - (unitLengthY / 2),
    unitLengthX * .7, //i want the rectangle size to scale w/ the size of a cell
    unitLengthY * .7,
    {
        label: 'goal',
        isStatic: true,
        render: {
            fillStyle: 'green'
        }
    } 
    );
World.add(world, goal);

// ***** BALL *****
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(
   // (x,y,r), r = radius of the circle; so we want it to be half the size of the cell and start in the center of the cell
    unitLengthX / 2,
    unitLengthY / 2,
    ballRadius,
    {
        label: 'ball',
        render: {
            fillStyle: 'yellow'
        }
    }
);
World.add(world, ball);

document.addEventListener('keydown', e => {
   if('keydown') {
    document.querySelector('.instructions').classList.add('hidden');
   };

    const { x, y } = ball.velocity;
    if(e.key === 'r') {
       Body.setVelocity(ball, {x, y: y -5 });
    } // up

    if(e.key === 'f') {
        Body.setVelocity(ball, {x: x + 5, y });
    } // rightt

    if(e.key === 'c') {
        Body.setVelocity(ball, {x, y: y + 5 });
    } // down

    if(e.key === 'd') {
        Body.setVelocity(ball, {x: x - 5, y });
    } // left
})


// ***** DETECT A COLLISION EVENT (WIN CONDITION) *****

Events.on(engine, 'collisionStart', e => {
    e.pairs.forEach(collision => {
        const labels = ['ball', 'goal'];

        if (labels.includes(collision.bodyA.label) &&
         labels.includes(collision.bodyB.label)
         ) {
            document.querySelector('.replay').classList.remove('hidden');
            document.querySelector('.winner').classList.remove('hidden');
            world.gravity.y = 1;
            world.bodies.forEach(body => {
                if (body.label === 'wall') {
                    Body.setStatic(body, false);
                }
            })
         }
    })
});