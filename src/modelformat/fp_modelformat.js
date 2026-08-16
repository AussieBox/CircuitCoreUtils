export function fpModelFormat() {
        const dialog = new Dialog({
                title: "Create First Person Animator",
                id: "first_person_animations",
                form: {
                        item_model_file: {
                                label: "Item Model File",
                                type: "file",
                                extensions: ["bbmodel"],
                                readtype: "text",
                                filetype: "Blockbench Model",
                                return_as: "file"
                        },
                },
                onConfirm() {
                        const result = this.getFormResult();
                        const file = result ? result.item_model_file : null;

                        if (!file || !file.content) {
                                Blockbench.showMessageBox({
                                        title: "Error",
                                        message: "No file was selected or the data stream is empty!"
                                });
                                return;
                        }

                        try {
                                const modelData = JSON.parse(file.content);

                                Project.select();

                                Codecs.project.merge(modelData, file.path);

                                const computedCenter = calculateCenterPivot(Cube.all);
                                const group = new Group({
                                        name: "Internal Offsets"
                                }).init();
                                const modelGroup = new Group({
                                        name: "Item",
                                        origin: computedCenter
                                }).init();
                                group.addTo(modelGroup);

                                Project.elements.forEach(element => {
                                        element.addTo(group);

                                        element.origin[0] = element.origin[0] + 3.35;
                                        element.origin[1] = element.origin[1] + 6.2;
                                        element.origin[2] = element.origin[2] + 11;

                                        // First Person - Right Hand
                                        /// todo: FIX TS :sob: (maybe do it on the group)

                                        element.origin[0] = element.origin[0] + 1.13;
                                        element.origin[1] = element.origin[1] + 3.2;
                                        element.origin[2] = element.origin[2] + 1.13;

                                        element.rotation[0] = element.rotation[0]; // keep same
                                        element.rotation[1] = element.rotation[1] - 90;
                                        element.rotation[2] = element.rotation[2] + 25;

                                        element.scale = [0.68, 0.68, 0.68];
                                });

                                Project.groups.forEach(value => {
                                        if (value.name !== "Item" && value.name !== "Internal Offsets") Project.groups.remove(value);
                                });

                                Canvas.updateAll();

                                Blockbench.showStatusMessage(`Loaded item model: ${file.name}`, 3000);
                        } catch (error) {
                                console.error(error);
                                Blockbench.showMessageBox({
                                        title: "Import Error",
                                        message: "Failed to import Blockbench file."
                                });
                        }
                }
        });

        return new ModelFormat("first_person_animations", {
                id: "first_person_animations",
                icon: "view_in_ar",
                name: "First Person Animations",
                description: "Create first-person animations for Circuit Core.",
                category: "minecraft",
                target: "Minecraft: Java Edition",
                box_uv: false,
                optional_box_uv: true,
                single_texture: false,
                animated_textures: true,
                bone_rig: true,
                centered_grid: true,
                rotate_cubes: true,
                uv_rotation: true,
                select_texture_for_particles: true,
                animation_files: true,
                display_mode: true,
                edit_mode: false,
                paint_mode: false,
                animation_mode: true,
                codec: Codecs.project,
                animation_codec: Codecs.bedrock.format.animation_codec,
                onSetup(project, newModel) {
                        if (newModel) dialog.show();
                }
        });
}

function calculateCenterPivot(elementArray) {
        if (!elementArray || elementArray.length === 0) return;

        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        elementArray.forEach(el => {
                if (el.from && el.to) {
                        minX = Math.min(minX, el.from[0], el.to[0]);
                        minY = Math.min(minY, el.from[1], el.to[1]);
                        minZ = Math.min(minZ, el.from[2], el.to[2]);

                        maxX = Math.max(maxX, el.from[0], el.to[0]);
                        maxY = Math.max(maxY, el.from[1], el.to[1]);
                        maxZ = Math.max(maxZ, el.from[2], el.to[2]);
                }
        });

        if (minX === Infinity) return;

        return [
                (minX + maxX) / 2,
                (minY + maxY) / 2,
                (minZ + maxZ) / 2
        ];
}
