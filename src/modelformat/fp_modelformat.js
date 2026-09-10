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
                                        message: "No file was selected!"
                                });
                                return;
                        }

                        try {
                                const modelData = JSON.parse(file.content);

                                Project.select();

                                Codecs.project.merge(modelData, file.path);

                                const modelGroup = new Group({
                                        name: "Item",
                                        origin: new THREE.Vector3(0, 0, 0)
                                }).init();
                                const group = new Group({
                                        name: "Internal Offsets",
                                        origin: new THREE.Vector3(0, 0, 0)
                                }).init();
                                group.addTo(modelGroup);

                                let rootGroups = Group.all.filter(g => !g.parent || g.parent === 'root');

                                rootGroups.forEach(pgroup => {
                                        if (pgroup !== modelGroup && pgroup !== group) {
                                                pgroup.addTo(group);
                                        }
                                });
                                let rootElements = Outliner.elements.filter(element => {
                                        return !(element instanceof Group) && (!element.parent || element.parent === 'root');
                                });

                                rootElements.forEach(element => {
                                        element.addTo(group);
                                });

                                Canvas.updateAll();

                                const positionalOffset = [
                                        3.35 + 1.13 + 10,
                                        6.2 + 3.2 - 4.5,
                                        11 + 1.13 - 12.5
                                ];

                                shiftGeometryOnly(group, positionalOffset);

                                Canvas.updateAll();

                                let newCenter = getCenter();

                                if (newCenter) {
                                        group.transferOrigin(newCenter);
                                        modelGroup.transferOrigin(newCenter);
                                }

                                /// todo: translate by [-8.35, 4.075, 9.9]

                                group.rotation[1] = -90;
                                modelGroup.rotation[0] = -25;
                                group.scale = [0.68, 0.68, 0.68];

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
                rotation_limit: false,
                rotation_snap: false,
                meshes: true,
                codec: Codecs.project,
                animation_codec: Codecs.bedrock.format.animation_codec,
                onSetup(project, newModel) {
                        if (newModel) dialog.show();
                }
        });
}

function getCenter() {
        let max = [-Infinity, -Infinity, -Infinity];
        let min = [ Infinity,  Infinity,  Infinity];

        Outliner.elements.forEach(element => {
                if (!(element instanceof Group && !Format.bone_rig) && element.getWorldCenter) {
                        const pos = element.getWorldCenter();
                        min[0] = Math.min(pos.x, min[0]);	max[0] = Math.max(pos.x, max[0]);
                        min[1] = Math.min(pos.y, min[1]);	max[1] = Math.max(pos.y, max[1]);
                        min[2] = Math.min(pos.z, min[2]);	max[2] = Math.max(pos.z, max[2]);
                }
        });

        let center = (min[0] === Infinity) ? [0, 0, 0] : max.V3_add(min).V3_divide(2, 2, 2);

        let isMesh = typeof TextureMesh !== 'undefined' && TextureMesh.all && TextureMesh.all.length > 0;
        if (isMesh) {
                center[0] += 8;
                center[1] -= 8;
                center[2] += 0.5;
        }

        if (!Format.centered_grid) {
                center = center.V3_add([8, 0, 8]);
        }

        return center;
}

function shiftGeometryOnly(targetGroup, offset) {
        let rawElements = [];

        function gather(grp) {
                if (!grp || !grp.children) return;
                grp.children.forEach(child => {
                        if (child.children) gather(child);
                        else rawElements.push(child);
                });
        }
        gather(targetGroup);

        rawElements.forEach(element => {
                if (element.from && element.to) {
                        element.from = [element.from[0] + offset[0], element.from[1] + offset[1], element.from[2] + offset[2]];
                        element.to   = [element.to[0]   + offset[0], element.to[1]   + offset[1], element.to[2]   + offset[2]];
                }
                if (element.vertices) {
                        for (let id in element.vertices) {
                                let v = element.vertices[id];
                                v.x += offset[0];
                                v.y += offset[1];
                                v.z += offset[2];
                        }
                }
                if (element.origin) {
                        element.origin = [element.origin[0] + offset[0], element.origin[1] + offset[1], element.origin[2] + offset[2]];
                }
        });
}
