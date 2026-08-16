import {fpModelFormat} from "./modelformat/fp_modelformat";

let FP_MODELFORMAT, renderFrameEvent;

Plugin.register('circuit-core', {
    title: 'Circuit Core Utils',
    author: 'AussieBox',
    icon: 'icon',
    description: 'Provides utilities for Circuit Core, including a first person animation editor.',
    version: '1.0.0',
    variant: 'desktop',
    await_loading: true,
    "tags": [
        "Minecraft: Java Edition"
    ],
    onload() {
        FP_MODELFORMAT = fpModelFormat();

        DisplayMode.load(0);

        // noinspection JSVoidFunctionReturnValueUsed
        renderFrameEvent = Blockbench.on("render_frame", (data) => {
            if (Project && Project.format.id === "first_person_animations") {

                if (Project.mode === "animate") {
                    if (main_preview && DisplayMode) {
                        DisplayMode.loadFirstRight();

                        main_preview.controls.enablePan = false;
                        main_preview.controls.enableZoom = false;
                        main_preview.controls.enableRotate = false;
                        main_preview.controls.target.set(0, 24, 0);
                        main_preview.camera.position.set(0, 24, 32.4);
                        main_preview.camera.up.set(0, 1, 0);
                        main_preview.camera.setFocalLength(getOptimalFocalLength());

                        main_preview.controls.update();
                    }
                } else {
                    Modes.options["display"].trigger();
                    Project.format.display_mode = false;
                    Modes.options["animate"].trigger();
                }
            } else {
                if (main_preview) {
                    main_preview.controls.enablePan = true;
                    main_preview.controls.enableZoom = true;
                    main_preview.controls.enableRotate = true;
                    main_preview.controls.update();
                }
            }
        });
    },
    onunload() {
        if (FP_MODELFORMAT) FP_MODELFORMAT.delete();
        if (renderFrameEvent) renderFrameEvent.delete();
    }
});

export function getOptimalFocalLength() {
    if (main_preview.camera.aspect > 1.7) {
        return 18 / main_preview.camera.aspect;
    } else if (main_preview.camera.aspect > 1.0) {
        return 16.57 + -3.57 * main_preview.camera.aspect;
    } else {
        return 13 * main_preview.camera.aspect;
    }
}