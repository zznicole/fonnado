function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required element: ${id}`);
  return element as T;
}

function getChildElement<T extends HTMLElement>(
  parent: HTMLElement,
  selector: string,
): T {
  const element = parent.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required child element: ${selector}`);
  return element;
}

function getCanvasContext(
  canvas: HTMLCanvasElement,
): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not initialize the preview canvas.");
  return context;
}

export function getElements() {
  const canvas = getElement<HTMLCanvasElement>("preview");
  const exportButton = getElement<HTMLButtonElement>("exportButton");

  return {
    stage: getElement<HTMLDivElement>("photoStage"),
    canvas,
    context: getCanvasContext(canvas),
    fileInput: getElement<HTMLInputElement>("fileInput"),
    uploadButton: getElement<HTMLButtonElement>("uploadButton"),
    replaceButton: getElement<HTMLButtonElement>("replaceButton"),
    placeholder: getElement<HTMLElement>("placeholder"),
    photoInfo: getElement<HTMLElement>("photoInfo"),
    liveBadge: getElement<HTMLElement>("liveBadge"),
    zoomInput: getElement<HTMLInputElement>("zoom"),
    zoomReadout: getElement<HTMLElement>("zoomReadout"),
    styleDropdown: getElement<HTMLDetailsElement>("styleDropdown"),
    styleDropdownTrigger: getElement<HTMLElement>("styleDropdownTrigger"),
    styleSelection: getElement<HTMLElement>("styleSelection"),
    exportButton,
    exportButtonLabel: getChildElement<HTMLSpanElement>(exportButton, "span"),
    exportNote: getElement<HTMLElement>("exportNote"),
    errorMessage: getElement<HTMLElement>("errorMessage"),
  };
}

export type AppElements = ReturnType<typeof getElements>;
