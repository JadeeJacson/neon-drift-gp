# `_candidates/` — 调研下载但**尚未接入**的候选素材

这里的东西**没有被任何场景或脚本引用**，只是备选池。别在这里改文件当成品用。

来源与逐个校验记录：`_scratch/viewmodel_research_20.md` + `assets/_downloads/polypizza-index-viewmodel.json`。
2026-09-27 首次调研下载了 428 个 GLB（140 MB），逐个校验全 PASS 后**只留了 12 个**（7.4 MB），
其余 417 个已删除——留一堆没人用的模型在仓库里只会让人误判「素材已经齐了」。

| 文件 | 授权 | 留着是因为 |
|---|---|---|
| `fps-rig-akm-U6l6wjxFhC.glb` | CC-BY 3.0 (J-Toastie) | 已复制进工程当步枪 viewmodel，这份是原件备份 |
| `fps-rig-uxko5LkGia.glb` | CC-BY 3.0 (J-Toastie) | 唯二「带手 + 真 Reload」的另一把（半自动/手枪角色，多一段 `Grip`） |
| `shotgun-pump-west-NfQETBKOiw.glb` | CC0 (Pichuliru) | 任务 #23：`Pump`/`Shell`/`Lifter` 是真骨骼，可做真泵动 |
| `assault-rifle-west-ss1nz3gJnx.glb` | CC0 (Pichuliru) | 19 根功能骨 + `Attach_Muzzle`/`Attach_Scope`，无剪辑 |
| `sniper-rifle-west-kwJawENuvA.glb` | CC0 (Pichuliru) | `Bolt` + `Magazine` 骨，DMR 的正式替身（现在暂用 .44 手枪） |
| `rifle-battle-east-tJaWNYo064.glb` | CC0 (Pichuliru) | 东系造型的第二把精确射手，可与西系混用 |
| `smg-west-7Dh5JSbZcp.glb` | CC0 (Pichuliru) | 若加第四把枪（SMG） |
| `wrad_fps_viewmodel_arms.glb` + 两张 albedo PNG | CC0-1.0 (wwwriks) | 唯一 CC0 且带 `wrist_ik`/`arm_target` 的持枪手，可贴到任意枪握把 |
| `character-enemy-mdGe4IN31v.glb` | CC0 (Quaternius) | 34 段动画，做精英怪或替换 heavy |
| `soldier-oAArCNHjFB.glb` | CC-BY 3.0 (Quaternius) | SWAT 的军装版，第二个可用人形 |

接入流程（步枪/精确射手/人形敌人都走的是这条）：
`tools/inspect_rig.gd` 解剖 → `tools/fit_viewmodel.gd` 两点锚定求摆放 → `tools/capture_view.gd` 截图判观感。
