# fonnado — animated image maker

A small, browser-based tool for turning a image into a looping animated image. The app uses plain HTML, CSS, and JavaScript; it has no build step, package installation, account, or server requirement.

## Run it

Keep these three application files together:

- `index.html` — page structure and controls
- `styles.css` — layout and visual styling
- `app.js` — photo handling, animation preview, and GIF export

Open `index.html` in a modern browser. If your browser restricts local-file features, serve the folder with any static web server and open its local address.

## Make an image

1. Select a photo with **Choose a image**, or drag your image onto the photo area. JPG, PNG, and WebP images are supported.
2. Drag the preview to reposition the image and use the zoom slider to adjust the crop.
3. Choose an animation style, image shape, and background color.
4. Select **Make my animated image** to download a looping GIF.

The exported GIF is 160 × 160 pixels with 16 frames at 80 ms per frame. Selecting the transparent backdrop exports transparent areas outside the image when using a circle crop.

## Privacy and limitations

Photos are opened and processed in the browser. The app does not upload them or send them to a server. GIF export is performed locally and may take a moment for larger photos.

The animation effects are applied to the image; this tool does not generate new poses or animate facial expressions.
