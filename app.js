const IMAGE_IDS = ["0", "1", "2", "3", "4"];
const ALPHAS = [-4, -2, 0, 2, 4];
const MODEL_OPTIONS = [
  { value: "vdvae", label: "Low-level / VDVAE" },
  { value: "versatile_diffusion", label: "High-level / Versatile Diffusion" },
];
const DIMENSION_OPTIONS = [
  { value: "emonet", label: "Emonet" },
  { value: "memnet", label: "Memnet" },
];

const state = {
  imageId: IMAGE_IDS[0],
  model: MODEL_OPTIONS[1].value,
  dimension: DIMENSION_OPTIONS[1].value,
  visibleAlphas: new Set(ALPHAS),
};

const elements = {
  imageSelect: document.querySelector("#image-select"),
  modelToggle: document.querySelector("#model-toggle"),
  dimensionToggle: document.querySelector("#dimension-toggle"),
  alphaToggle: document.querySelector("#alpha-toggle"),
  summary: document.querySelector("#selection-summary"),
  originalImage: document.querySelector("#original-image"),
  negativeColumn: document.querySelector("#negative-column"),
  positiveColumn: document.querySelector("#positive-column"),
  alphaZeroSlot: document.querySelector("#alpha-zero-slot"),
  alphaCardTemplate: document.querySelector("#alpha-card-template"),
};

initialize();

function initialize() {
  populateImageSelect();
  renderSegmentedButtons(elements.modelToggle, MODEL_OPTIONS, state.model, handleModelChange);
  renderSegmentedButtons(elements.dimensionToggle, DIMENSION_OPTIONS, state.dimension, handleDimensionChange);
  renderAlphaButtons();
  renderViewer();
}

function populateImageSelect() {
  IMAGE_IDS.forEach((imageId) => {
    const option = document.createElement("option");
    option.value = imageId;
    option.textContent = `Example ${imageId}`;
    elements.imageSelect.append(option);
  });

  elements.imageSelect.value = state.imageId;
  elements.imageSelect.addEventListener("change", (event) => {
    state.imageId = event.target.value;
    renderViewer();
  });
}

function renderSegmentedButtons(container, options, currentValue, onChange) {
  container.innerHTML = "";

  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option.label;
    button.dataset.value = option.value;
    button.classList.toggle("is-active", option.value === currentValue);
    button.addEventListener("click", () => onChange(option.value));
    container.append(button);
  });
}

function renderAlphaButtons() {
  elements.alphaToggle.innerHTML = "";

  ALPHAS.forEach((alpha) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = formatAlpha(alpha);
    button.dataset.alpha = String(alpha);
    button.classList.toggle("is-active", state.visibleAlphas.has(alpha));

    button.addEventListener("click", () => {
      if (state.visibleAlphas.has(alpha)) {
        state.visibleAlphas.delete(alpha);
      } else {
        state.visibleAlphas.add(alpha);
      }

      button.classList.toggle("is-active", state.visibleAlphas.has(alpha));
      renderViewer();
    });

    elements.alphaToggle.append(button);
  });
}

function handleModelChange(model) {
  state.model = model;
  syncSegmentedState(elements.modelToggle, state.model);
  renderViewer();
}

function handleDimensionChange(dimension) {
  state.dimension = dimension;
  syncSegmentedState(elements.dimensionToggle, state.dimension);
  renderViewer();
}

function syncSegmentedState(container, currentValue) {
  container.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.value === currentValue);
  });
}

function renderViewer() {
  const { imageId, model, dimension } = state;

  elements.originalImage.src = buildOriginalPath(imageId);
  elements.originalImage.alt = `Original image example ${imageId}`;

  elements.summary.textContent = `Example ${imageId} · ${getLabel(MODEL_OPTIONS, model)} · ${getLabel(DIMENSION_OPTIONS, dimension)} · ${
    state.visibleAlphas.size
  } alpha level${state.visibleAlphas.size === 1 ? "" : "s"} visible`;

  renderAlphaColumns();
}

function renderAlphaColumns() {
  elements.negativeColumn.innerHTML = "";
  elements.positiveColumn.innerHTML = "";
  elements.alphaZeroSlot.innerHTML = "";

  const negativeAlphas = [-4, -2].filter((alpha) => state.visibleAlphas.has(alpha));
  const positiveAlphas = [2, 4].filter((alpha) => state.visibleAlphas.has(alpha));
  const showZero = state.visibleAlphas.has(0);

  negativeAlphas.forEach((alpha) => {
    elements.negativeColumn.append(createAlphaCard(alpha));
  });

  positiveAlphas.forEach((alpha) => {
    elements.positiveColumn.append(createAlphaCard(alpha));
  });

  if (showZero) {
    elements.alphaZeroSlot.append(createAlphaCard(0));
  }

  if (!negativeAlphas.length) {
    elements.negativeColumn.append(createEmptyState("No negative alpha levels selected.", "left"));
  }

  if (!positiveAlphas.length) {
    elements.positiveColumn.append(createEmptyState("No positive alpha levels selected.", "right"));
  }

  if (!showZero) {
    elements.alphaZeroSlot.append(createEmptyState("Alpha 0 is currently hidden.", "center"));
  }
}

function createAlphaCard(alpha) {
  const fragment = elements.alphaCardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".alpha-card");
  const title = fragment.querySelector("h3");
  const image = fragment.querySelector("img");

  card.dataset.alpha = String(alpha);
  title.textContent = `Alpha ${formatAlpha(alpha)}`;
  image.src = buildManipulatedPath(state.imageId, state.model, state.dimension, getDisplayMappedAlpha(state.dimension, alpha));
  image.alt = `${getLabel(MODEL_OPTIONS, state.model)} ${getLabel(DIMENSION_OPTIONS, state.dimension)} alpha ${alpha} for example ${state.imageId}`;

  return fragment;
}

function createEmptyState(message, region) {
  const empty = document.createElement("div");
  empty.className = `empty-state empty-state--${region}`;
  empty.textContent = message;
  return empty;
}

function buildOriginalPath(imageId) {
  return `./original_test_images/${imageId}.png`;
}

function buildManipulatedPath(imageId, model, dimension, alpha) {
  return `./reconstrutions/${model}/${dimension}/alpha_${alpha}/${imageId}.png`;
}

function getDisplayMappedAlpha(dimension, alpha) {
  if (dimension === "emonet") {
    return alpha * -1;
  }

  return alpha;
}

function getLabel(options, value) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatAlpha(alpha) {
  return alpha > 0 ? `+${alpha}` : `${alpha}`;
}
