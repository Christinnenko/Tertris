const canvas = document.getElementById("board"); // Получаем ссылку на элемент холста с идентификатором "board"
const context = canvas.getContext("2d"); // Получаем контекст рисования 2D для холста
const rows = 20; // Количество строк и столбцов в игровом поле
const columns = 10;
const squareSize = 40; // Размер квадрата (ячейки) на игровом поле
let counter = document.getElementById("score"); // Получаем ссылку на элемент с идентификатором "score"
let score = parseInt(counter.innerHTML); // Извлекаем значение счета из HTML-элемента и преобразуем его в число
let time = document.getElementById("time"); // Получаем ссылку на элемент с идентификатором "time"
let timer = 0; // Инициализируем переменную для хранения времени игры
const levelElement = document.getElementById("level"); // Получаем ссылку на элемент с идентификатором "level"
let currentLevel = 1; // Инициализируем переменную для хранения текущего уровня
canvas.width = columns * squareSize; // Устанавливаем размеры холста в соответствии с размерами игрового поля и квадрата
canvas.height = rows * squareSize;
let count = 0; // Инициализируем переменные для отслеживания кадров анимации
let start = null;
let gameOver = false; // Флаг завершения игры
let timerId; // Идентификатор таймера
let baseSpeed = 35; // Базовая скорость падения фигур
let speedIncreaseInterval; // Интервал увеличения скорости падения фигур
const speedIncreaseIntervalTime = 30000; // Время между увеличениями скорости (30сек)
let timeSinceLastSpeedIncrease = 0; // Время, прошедшее с последнего увеличения скорости
let isGameRunning = false; // Флаг, указывающий на текущий статус игры (запущена или нет)
const buttonStart = document.getElementById("start"); // Получаем ссылку на кнопку с идентификатором "start"

// двумерный массив игрового поля, заполняем пустыми ячейками (0)
let arrayField = [];
for (let row = -2; row < 20; row++) {
  arrayField[row] = [];

  for (let col = 0; col < 10; col++) {
    arrayField[row][col] = 0;
  }
}

//фигуры тетриса
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

  return {
    name: randomFigureName, // название фигуры (L, O, и т.д.)
    matrix: coordinates, // матрица с фигурой
    row: row, // текущая строка (фигуры стартуют за видимой областью холста)
    col: col, // текущий столбец
    color: color, // цвет фигуры
  };
}

// поворачиваем матрицу с фигурой на 90 градусов
function rotate(matrix) {
  const N = matrix.length - 1;
  const result = matrix.map((row, i) => row.map((val, j) => matrix[N - j][i]));
  // на входе  и выходе - матрица с фигурой
  return result;
}

// проверяем после появления или вращения, может ли матрица с фигурой быть в этом месте поля или она вылезет за его границы
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
        return false; // то возвращаем, что так ставить нельзя
      }
    }
  }
  return true; // иначе ставить можно
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

  score += lineScore; // увеличиваем общий счет
  counter.innerHTML = score;

  figure = getFigure(); // получаем следующую фигуру
}

// показываем надпись Game Over
function showGameOver() {
  cancelAnimationFrame(start); // прекращаем всю анимацию игры
  gameOver = true; // ставим флаг окончания

  // рисуем чёрный прямоугольник посередине поля
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
  context.fillStyle = "white";
  context.font = "32px monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";

  // создаем строки
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

  stopTimer(); // Остановка интервала таймера

  // Добавляем условие: уровень не увеличивается после завершения игры
  if (!gameOver) {
    // увеличиваем уровень
    currentLevel++;
    // обновляем отображение уровня на странице
    levelElement.innerHTML = currentLevel;
  }
}

function updateTimer() {
  timerId = setTimeout(() => {
    if (!gameOver) {
      timer++;
      time.innerHTML = formatTime(timer);
      updateTimer(); // Рекурсивный вызов для обновления каждую секунду
    }
  }, 1000);
}

// Функция остановки таймера
function stopTimer() {
  clearTimeout(timerId);
}

// главный цикл игры
function game() {
  // начинаем анимацию
  start = requestAnimationFrame(game);

  isGameRunning = true;
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
  // если игра закончилась — отключаем клавиши
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

//форматируем дату мм:cc
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");
  return `${formattedMinutes}:${formattedSeconds}`;
}

//обработчик клика на кнопку "Начать игру"
function listenerStartButton() {
  buttonStart.addEventListener("click", () => {
    if (!isGameRunning) {
      startGame(); // Если игра не запущена, начать новую игру
    } else {
      restartGame(); // Если игра уже запущена, начать заново
    }
  });
}

//повышение уровня и скорости
function upLevel() {
  speedIncreaseInterval = setInterval(() => {
    // Увеличиваем базовую скорость
    baseSpeed = Math.max(baseSpeed - 3, 0);
    // Увеличиваем уровень
    currentLevel++;
    // Обновляем отображение уровня на странице
    levelElement.innerHTML = currentLevel;
  }, speedIncreaseIntervalTime);
}

//запуск игры
function startGame() {
  game();
  buttonStart.innerHTML = "Начать заново";
  //запуск увеличения уровня и таймера
  upLevel();
  updateTimer();
}

//перезапуск игры
function restartGame() {
  isGameRunning = false;
  gameOver = false;

  // Обнуляем счетчик, таймер, скорость, уровень
  score = 0;
  counter.innerHTML = score;
  timer = 0;
  time.innerHTML = formatTime(timer);
  baseSpeed = 35;
  currentLevel = 1;
  levelElement.innerHTML = currentLevel;

  // Останавливаем предыдущий цикл игры и интервал увеличения скорости
  cancelAnimationFrame(start);
  clearInterval(speedIncreaseInterval);

  // Очищаем массив игрового поля
  arrayField = [];
  for (let row = -2; row < 20; row++) {
    arrayField[row] = [];
    for (let col = 0; col < 10; col++) {
      arrayField[row][col] = 0;
    }
  }

  game(); // Начинаем новый цикл игры
  figure = getFigure(); // Получаем новую фигуру
  upLevel();
  updateTimer();
}

// текущая фигура в игре
let figure = getFigure();
listenerStartButton();
