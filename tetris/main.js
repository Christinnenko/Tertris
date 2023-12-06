const canvas = document.getElementById("board");
const context = canvas.getContext("2d");
const rows = 20;
const columns = 10;
const squareSize = 40;
let counter = document.getElementById("score");
let score = parseInt(counter.innerHTML);
let time = document.getElementById("time");
let timer = 0;
const levelElement = document.getElementById("level");
let currentLevel = 1;
canvas.width = columns * squareSize;
canvas.height = rows * squareSize;

// с помощью двумерного массива следим за тем, что находится в каждой клетке игрового поля
// размер поля — 10 на 20, и несколько строк ещё находится за видимой областью
let arrayField = [];
// заполняем сразу массив пустыми ячейками
for (let row = -2; row < 20; row++) {
  arrayField[row] = [];

  for (let col = 0; col < 10; col++) {
    arrayField[row][col] = 0;
  }
}

const figures = {
  I: {
    coordinates: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "#dd0000",
  },
  J: {
    coordinates: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#1454f5",
  },
  L: {
    coordinates: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#ff16ed",
  },
  O: {
    coordinates: [
      [1, 1],
      [1, 1],
    ],
    color: "#ff911f",
  },
  S: {
    coordinates: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: "#6aff1f",
  },
  Z: {
    coordinates: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: "#1ff3ff",
  },
  T: {
    coordinates: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#eeff1f",
  },
};

// счётчик
let count = 0;
// текущая фигура в игре
let figure = getFigure();
// следим за кадрами анимации, чтобы если что — остановить игру
let start = null;
// флаг конца игры, на старте — неактивный
let gameOver = false;

// получаем следующую фигуру
function getFigure() {
  // Получаем все ключи (названия фигур) из объекта figures
  const figureNames = Object.keys(figures);

  // Выбираем случайное название фигуры из массива figureNames
  const randomIndex = Math.floor(Math.random() * figureNames.length);
  const randomFigureName = figureNames[randomIndex];

  // Получаем информацию о случайной фигуре из объекта figures
  const { coordinates, color } = figures[randomFigureName];

  // I и O стартуют с середины, остальные — чуть левее
  const col = arrayField[0].length / 2 - Math.ceil(coordinates[0].length / 2);

  // I начинает с 21 строки (смещение -1), а все остальные — со строки 22 (смещение -2)
  const row = randomFigureName === "I" ? -1 : -2;

  // вот что возвращает функция
  return {
    name: randomFigureName, // название фигуры (L, O, и т.д.)
    matrix: coordinates, // матрица с фигурой
    row: row, // текущая строка (фигуры стартую за видимой областью холста)
    col: col, // текущий столбец
    color: color, // цвет фигуры
  };
}

// поворачиваем матрицу на 90 градусов
// https://codereview.stackexchange.com/a/186834
function rotate(matrix) {
  const N = matrix.length - 1;
  const result = matrix.map((row, i) => row.map((val, j) => matrix[N - j][i]));
  // на входе матрица, и на выходе тоже отдаём матрицу
  return result;
}

// проверяем после появления или вращения, может ли матрица (фигура) быть в этом месте поля или она вылезет за его границы
function isValidMove(matrix, cellRow, cellCol) {
  // проверяем все строки и столбцы
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (
        matrix[row][col] &&
        // если выходит за границы поля…
        (cellCol + col < 0 ||
          cellCol + col >= arrayField[0].length ||
          cellRow + row >= arrayField.length ||
          // …или пересекается с другими фигурами
          arrayField[cellRow + row][cellCol + col])
      ) {
        // то возвращаем, что нет, так не пойдёт
        return false;
      }
    }
  }
  // а если мы дошли до этого момента и не закончили раньше — то всё в порядке
  return true;
}

// когда фигура окончательна встала на своё место
function placeFigure() {
  // обрабатываем все строки и столбцы в игровом поле
  for (let row = 0; row < figure.matrix.length; row++) {
    for (let col = 0; col < figure.matrix[row].length; col++) {
      if (figure.matrix[row][col]) {
        // если край фигуры после установки вылезает за границы поля, то игра закончилась
        if (figure.row + row < 0) {
          return showGameOver();
        }
        // если всё в порядке, то записываем в массив игрового поля нашу фигуру
        arrayField[figure.row + row][figure.col + col] = figure.name;
      }
    }
  }

  // проверяем, чтобы заполненные ряды очистились снизу вверх
  let completedLines = 0;
  for (let row = arrayField.length - 1; row >= 0; ) {
    // если ряд заполнен
    if (arrayField[row].every((cell) => !!cell)) {
      completedLines++;

      // очищаем его и опускаем всё вниз на одну клетку
      for (let r = row; r >= 0; r--) {
        for (let c = 0; c < arrayField[r].length; c++) {
          arrayField[r][c] = arrayField[r - 1][c];
        }
      }
    } else {
      // переходим к следующему ряду
      row--;
    }
  }

  // рассчитываем очки в соответствии с количеством завершенных линий
  let lineScore = 0;
  switch (completedLines) {
    case 0:
      lineScore = 0;
      break;
    case 1:
      lineScore = 100;
      break;
    case 2:
      lineScore = 300;
      break;
    case 3:
      lineScore = 700;
      break;
    default:
      lineScore = 1500;
      break;
  }

  // увеличиваем общий счет
  score += lineScore;
  counter.innerHTML = score;

  // получаем следующую фигуру
  figure = getFigure();
}

// показываем надпись Game Over
function showGameOver() {
  // прекращаем всю анимацию игры
  cancelAnimationFrame(start);
  // ставим флаг окончания
  gameOver = true;

  // рисуем чёрный прямоугольник посередине поля с некоторым запасом по высоте
  const rectHeight = 250;
  context.fillStyle = "black";
  context.globalAlpha = 0.75;
  context.fillRect(
    0,
    canvas.height / 2 - rectHeight / 2,
    canvas.width,
    rectHeight
  );

  // пишем надпись белым моноширинным шрифтом по центру
  context.globalAlpha = 1;
  context.fillStyle = "white";
  context.font = "32px monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";

  // создаем строки с переносами
  const lines = [
    "GAME OVER!",
    `Счет: ${score}`,
    `Время: ${formatTime(timer)}`,
    `Уровень: ${currentLevel}`,
  ];

  // вычисляем высоту строки и отступ между строками
  const lineHeight = 20;
  const totalHeight = lines.length * lineHeight;

  // отрисовываем строки с учетом отступа
  lines.forEach((line, index) => {
    context.fillText(
      line,
      canvas.width / 2,
      canvas.height / 2 - totalHeight / 2 + index * (lineHeight + 20)
    );
  });

  // Остановка интервала таймера
  stopTimer();

  // Останавливаем интервал увеличения уровней, если он был определен
  if (speedIncreaseInterval) {
    clearInterval(speedIncreaseInterval);
    speedIncreaseInterval = null; // сбрасываем переменную интервала
  }

  // Добавляем условие: уровень не увеличивается после завершения игры
  if (!gameOver) {
    // увеличиваем уровень
    currentLevel++;
    // обновляем отображение уровня на странице
    levelElement.innerHTML = currentLevel;
  }
}
// Объявляем переменную для хранения идентификатора таймера
let timerId;

// Функция остановки таймера
function stopTimer() {
  clearTimeout(timerId);
}

// главный цикл игры
function game() {
  // начинаем анимацию
  start = requestAnimationFrame(game);
  // очищаем холст
  context.clearRect(0, 0, canvas.width, canvas.height);

  // рисуем игровое поле с учётом заполненных фигур
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 10; col++) {
      if (arrayField[row][col]) {
        const name = arrayField[row][col];

        // Получаем цвет из объекта figures
        const color = figures[name].color;
        context.fillStyle = color;

        // рисуем всё на один пиксель меньше, чтобы получился эффект «в клетку»
        context.fillRect(
          col * squareSize,
          row * squareSize,
          squareSize - 1,
          squareSize - 1
        );
      }
    }
  }

  // рисуем текущую фигуру
  if (figure) {
    // фигура сдвигается вниз каждые baseSpeed кадров
    if (++count > baseSpeed) {
      figure.row++;
      count = 0;

      // если движение закончилось — рисуем фигуру в поле и проверяем, можно ли удалить строки
      if (!isValidMove(figure.matrix, figure.row, figure.col)) {
        figure.row--;
        placeFigure();
      }
    }

    // не забываем про цвет текущей фигуры
    const color = figures[figure.name].color;
    context.fillStyle = color;

    // отрисовываем её
    for (let row = 0; row < figure.matrix.length; row++) {
      for (let col = 0; col < figure.matrix[row].length; col++) {
        if (figure.matrix[row][col]) {
          // и снова рисуем на один пиксель меньше
          context.fillRect(
            (figure.col + col) * squareSize,
            (figure.row + row) * squareSize,
            squareSize - 1,
            squareSize - 1
          );
        }
      }
    }
  }
  // Увеличиваем время с последнего увеличения скорости
  timeSinceLastSpeedIncrease++;
  // Если прошло достаточно времени, увеличиваем скорость
  if (timeSinceLastSpeedIncrease >= speedIncreaseIntervalTime) {
    baseSpeed = Math.max(baseSpeed - 3, 0);
  }

  console.log("Текущая скорость:", baseSpeed);
}

// следим за нажатиями на клавиши
document.addEventListener("keydown", function (e) {
  // если игра закончилась — сразу выходим
  if (gameOver) return;

  // стрелки влево и вправо
  if (e.which === 37 || e.which === 39) {
    const col =
      e.which === 37
        ? // если влево, то уменьшаем индекс в столбце, если вправо — увеличиваем
          figure.col - 1
        : figure.col + 1;

    // если так ходить можно, то запоминаем текущее положение
    if (isValidMove(figure.matrix, figure.row, col)) {
      figure.col = col;
    }
  }

  // стрелка вверх — поворот
  if (e.which === 38) {
    // поворачиваем фигуру на 90 градусов
    const matrix = rotate(figure.matrix);
    // если так ходить можно — запоминаем
    if (isValidMove(matrix, figure.row, figure.col)) {
      figure.matrix = matrix;
    }
  }

  // стрелка вниз — ускорить падение
  if (e.which === 40) {
    // смещаем фигуру на строку вниз
    const row = figure.row + 1;
    // если опускаться больше некуда — запоминаем новое положение
    if (!isValidMove(figure.matrix, row, figure.col)) {
      figure.row = row - 1;
      // ставим на место и смотрим на заполненные ряды
      placeFigure();
      return;
    }
    // запоминаем строку, куда стала фигура
    figure.row = row;
  }
});

let baseSpeed = 35; // Базовая скорость
let speedIncreaseInterval;
const speedIncreaseIntervalTime = 30000; //
let timeSinceLastSpeedIncrease = 0;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");
  return `${formattedMinutes}:${formattedSeconds}`;
}

let isGameRunning = false;
const buttonStart = document.getElementById("start");

//обработчик клика на кнопку "Начать игру"
export function listenerStartButton() {
  buttonStart.addEventListener("click", () => {
    if (!isGameRunning) {
      // Если игра не запущена, начать новую игру
      startGame();
    } else {
      // Если игра уже запущена, начать заново
      restartGame();
    }
  });
}

//запуск игры
export function startGame() {
  // старт игры
  game();
  isGameRunning = true;
  buttonStart.innerHTML = "Начать заново";

  speedIncreaseInterval = setInterval(() => {
    // Увеличиваем базовую скорость
    baseSpeed = Math.max(baseSpeed - 3, 0);
    // Увеличиваем уровень
    currentLevel++;
    // Обновляем отображение уровня на странице
    levelElement.innerHTML = currentLevel;
  }, speedIncreaseIntervalTime);

  function updateTimer() {
    timerId = setTimeout(() => {
      timer++;
      time.innerHTML = formatTime(timer);
      updateTimer(); // Рекурсивный вызов для обновления каждую секунду
    }, 1000);
  }

  // Запустите таймер при начале игры
  updateTimer();
}

//перезапуск игры
export function restartGame() {
  count = 0;
  isGameRunning = false;
  gameOver = false;

  // Обнуляем счетчик
  score = 0;
  counter.innerHTML = score;

  // Обнуляем таймер
  timer = 0;
  time.innerHTML = formatTime(timer);

  //Обнуляем скорость
  baseSpeed = 35;

  //Обнуляем уровень
  currentLevel = 1;
  levelElement.innerHTML = currentLevel;

  // Останавливаем предыдущий цикл игры
  cancelAnimationFrame(start);

  // Очищаем массив игрового поля
  arrayField = [];
  for (let row = -2; row < 20; row++) {
    arrayField[row] = [];
    for (let col = 0; col < 10; col++) {
      arrayField[row][col] = 0;
    }
  }

  // Останавливаем интервал увеличения скорости
  clearInterval(speedIncreaseInterval);

  // Получаем новую фигуру
  figure = getFigure();

  // Начинаем новый цикл игры
  start = requestAnimationFrame(game);
  isGameRunning = true;
  speedIncreaseInterval = setInterval(() => {
    baseSpeed = Math.max(baseSpeed - 3, 0);
  }, speedIncreaseIntervalTime);

  updateTimer();
}

listenerStartButton();
