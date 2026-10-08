# York3D Toyota LC200

[在线体验 / Live demo](https://york3d-lc200.vercel.app/) · [GitHub](https://github.com/York8848/york3d-toyota-lc200) · [MIT License](LICENSE)

中英双语参数化汽车造型研究。React + TypeScript + Vite + Three.js，静态网站，无后端、账户、数据库或运行时 AI API。

**原创简化模型 / Original simplified model**。Toyota Land Cruiser LC200 是外观比例与造型参考。本项目不是 Toyota 官方产品、原厂 CAD、EPC 或官方数字孪生。**原创简化模型 ≠ Toyota 官方汽车零件数据**。

## 快速运行

需要 Node.js 22.12+ 及 npm，建议使用 Node.js 24 LTS。

```bash
npm ci
npm run dev
```

打开终端显示的本地地址，默认 <http://127.0.0.1:5173/>。

```bash
npm run typecheck             # TypeScript 类型检查
npm run validate:model        # 几何、目录、Picking、复位、阵列与相机验证
npm run build                 # 类型检查 + 生产构建
npm run validate:production   # 模型验证 + 构建 + 静态资源检查
npm run preview               # 本地预览 dist，默认端口 4173
npm run licenses              # 重建依赖许可证清单
```

当前 Mac 的 shell 最初没有 Node/npm 命令。开发时用了 Codex 自带 Node 与从 npm 官方 registry 下载到忽略目录 `.tools/` 的 npm 11.6.0。当前电脑可运行：

```bash
./scripts/local.sh run dev
./scripts/local.sh run validate:production
```

这只是本机便利启动器。新电脑安装标准 Node/npm 后执行 `npm ci`，不依赖 Codex 缓存或 `.tools/`。模型全部来自源码，无需下载车辆资产。

## 实际模型

最新结果见 `reports/model-validation.json`，导出的真实目录为 `reports/component-catalog.json`。

| 分类                 | 实际 Mesh |
| -------------------- | --------: |
| body / 车身与外观    |        77 |
| glass / 玻璃与车窗   |        11 |
| lights / 灯组与照明  |        35 |
| wheels / 车轮与制动  |        92 |
| cabin / 座舱与内饰   |        77 |
| structure / 结构示意 |        58 |
| **合计**             |   **350** |

**499,020 个三角面**，不含展台和环境。每个目录 ID 对应一个独立 Mesh。轮胎采用越野胎截面、错列斜向胎块和胎肩咬边；胎块与胎体合为一个轮胎 Mesh，不增加目录数量，外径保持原设计值。每轮有 10 根成对轮辐与 6 个真实装配位置的轮毂螺母。没有外部 GLB、贴图汽车或隐藏占位部件。

GEN ID 是**本项目内部网格编号，不是 Toyota 官方零件号**。固定源码与相同参数生成相同几何、ID 和顺序；新增或重排生成代码可能改变后续顺序编号，因此 GEN ID 不作为跨模型版本的工程标识。

## 生成流程与代码

```text
AI 编写 TypeScript 程序
  ↓
程序根据比例参数与面板控制点生成真实三维几何
  ↓
Registry 为每个 Mesh 建立 Component 元数据与目录
  ↓
Three.js 渲染到 WebGL canvas
  ↓
React UI 状态驱动部件位置、可见性、材质和相机
```

| 文件                           | 作用                                                         |
| ------------------------------ | ------------------------------------------------------------ |
| `src/model/parameters.ts`      | 设计比例、分类与双语分类名                                   |
| `src/model/geometry.ts`        | 截面放样、带厚度的轮廓拉伸、弧形轮眉、曲线路径               |
| `src/model/glazing.ts`       | 玻璃开口、风挡曲面及窗框共享边界                             |
| `src/model/body.ts`            | 独立车门、翼子板、发动机盖、车顶、尾门、风挡与外饰           |
| `src/model/wheels.ts`          | 轮胎与胎纹、轮辋、轮辐、轮毂、制动件、螺母                   |
| `src/model/lights.ts`          | 灯座、透镜、透明灯罩、日行灯与尾灯                           |
| `src/model/cabin.ts`           | 三排座椅、头枕、仪表台、方向盘与门内饰示意                   |
| `src/model/structure.ts`       | 车架、动力总成、悬架、排气等结构示意                         |
| `src/model/registry.ts`        | 材质、世界坐标烘焙、独立材质、真实 Mesh 登记                 |
| `src/model/buildVehicle.ts`    | 依次生成与统一释放                                           |
| `src/scene/explosion.ts`       | 不累计误差的展开、按投影尺寸排布、相机取景                   |
| `src/scene/SceneController.ts` | Renderer、光照、OrbitControls、Raycaster、交互与资源生命周期 |
| `src/scene/VehicleScene.tsx`   | 真实初始化阶段与错误重试                                     |
| `src/App.tsx`                  | 双语 UI、分类、目录、详情、模态对话框                        |

## 坐标与参数

单位按米表达，**所有数值是造型研究的设计值，不是 Toyota 官方尺寸**。

- **+X：车头 / 前进方向**；−X：车尾。
- **+Y：竖直向上**；XZ 平面为水平面。
- **+Z：车辆左侧**（驾驶员面向前方时）；−Z：车辆右侧。
- X=0 是前后轮轴中点，Z=0 是车辆左右中心平面。
- 世界地面 Y=0；展台顶面 Y=0.0535，轮胎底部约 Y=0.055。
- 每个部件的几何重心参考为轴对齐包围盒中心；几何局部坐标以此为原点。
- `vehicle` 父级保持单位旋转、单位缩放。创建部件时的局部旋转与位移先烘焙进几何，再登记不可变 original transform，避免展开时混用父子坐标。

`parameters.ts` 中包含：

| 参数                         | 默认值                         | 含义                                     |
| ---------------------------- | ------------------------------ | ---------------------------------------- |
| length / width / height      | 4.95 / 1.98 / 1.92             | 名义车身体量，外饰和行李架可超出         |
| wheelbase                    | 2.85                           | 前后轮轴间距                             |
| frontTrack / rearTrack       | 1.68 / 1.68                    | 轮胎中心之间的横向距离                   |
| wheelRadius / tireWidth      | 0.405 / 0.285                  | 轮胎比例                                 |
| clearance                    | 0.23                           | 设计离地间隙参考；结构示意有各自局部高度 |
| engineBay                    | X=1.0…2.35                     | 发动机舱布置参考                         |
| cabin                        | X=−2.28…0.98                   | 座舱布置参考                             |
| pillars A/B/C/D              | X=0.48 / −0.32 / −1.25 / −2.22 | 柱位与窗轮廓参考                         |
| windshieldAngle              | 32°                            | 风挡倾斜设计参考                         |
| roofCurve                    | 0.045                          | 车顶放样横向拱高                         |
| hoodHeight / rearHeight      | 1.38 / 1.85                    | 前后车身造型参考                         |
| frontOverhang / rearOverhang | 1.05 / 1.05                    | 前后悬参考                               |
| radialSegments               | 40                             | 轮胎环向细分                             |

**参数编辑方式**：轴距、轮距、轮胎尺寸直接参与几何计算；宽度、车顶弧度及轮廓由曲面控制点定义；整体轮廓还由各模块的截面与轮廓控制点共同决定。长度、高度、柱位和舱室边界是集中记录的设计基准，修改它们时需同步调整相应控制点。本版没有“任意尺寸输入都自动修正全部接缝”的约束求解器。修改几何后请重新运行模型验证并检查四个视角。

## 交互

- 鼠标拖动旋转、滚轮缩放；OrbitControls 支持触屏旋转和双指缩放。
- 透视、正面、侧面、俯视；适应视图、放大缩小、手动开启自动旋转、线框。
- 点击车辆 Mesh 高亮。拖动超过 5px、多指手势或 pointercancel 不触发选择。
- Raycaster 仅检测当前可见且可交互的登记部件，不检测展台、灯光或辅助对象。
- 分类默认突出所选系统，其他系统透明度降为 0.09；“仅显示当前分类”可隔离该系统。
- 目录可搜索中英名称和 GEN ID。选中目录条目会解除先前分类/单件可见性限制，使对应部件可访问。
- 详情包含中英名称、ID、分类与 representation；可隔离和取景，即使是螺母。
- Reset 恢复装配、相机、controls target、分类、选择、隔离、材质透明度、线框和自动旋转。语言是独立偏好，不随 Reset 改变。
- 切换语言不会重建模型或改变相机、选择与展开程度。

### 展开与阵列

- 0–50%：按照分类、中心、方向和权重移动，使用平滑插值。
- 50–100%：每个 Mesh 独立过渡到部件阵列。
- 100%：以默认观察平面的投影尺寸进行 shelf packing，使用尺寸比例和间距，非固定小格。
- 相机使用实际各 Mesh 包围盒的八个角点、屏幕比例和 FOV 求解距离；手机增加观察余量。
- 每次根据原始 position/rotation/scale 重新计算，绝不使用 `position += delta`。
- 用户手动操作相机后不会被持续强制回正；再次调整展开滑杆会重新启用针对该展开状态的取景。
- 手动旋转最终阵列后允许出现遮挡，仍可通过目录选择、隔离和取景。

**原创模型的视觉展开，非真实拆装顺序。** 这不是维修或机械拆装仿真。

## 性能与资源

- 模型仅在初始化/重试时生成；UI 重渲染及动画帧不会重建几何。
- 每个 Mesh 独立材质，防止单件选择引发整组高亮。
- DPR 上限 1.75，2048² 阴影，程序生成的 RoomEnvironment 环境反射；无远程纹理请求。
- 静止时停止动画帧；仅相机阻尼、自动旋转或状态变化触发绘制。
- 页面隐藏时暂停帧循环，卸载时释放 geometry/material/environment/renderer/controls/listeners/observer。
- 自动旋转默认关闭，尊重 reduced-motion 的 UI 动效偏好。
- 没有测量跨设备 FPS，不承诺稳定 60 FPS。

## 验证与截图

详见 `reports/QA.md`。本次实际通过：

- TypeScript 检查、Production build 和生产静态资源验证。
- 350 个登记 Mesh 与实际模型遍历数量相等，ID 唯一。
- 两次生成的几何、顺序、变换和元数据哈希一致。
- 有效几何、非空顶点、有限坐标/法线/包围盒、无完全同位置重复几何。
- 全部 Mesh 的独立 Raycaster 检测与取景距离计算。
- 0/25/50/75/100%，重复 0→100→0；最大复位位移误差为 **0**。
- 100% 默认相机下，三种画幅的投影包围矩形重叠数 **0**，全部入画。
- Codex 内置 Chromium 浏览器：1366×768、1440×900、390×844 视口测试；实际保存整车、中间展开、完全阵列、单件隔离和手机截图。

模型验证不等于完整车辆工程碰撞检测。截图检查用于发现明显穿模；任意视角、全部曲面和真实手机触控仍需进一步人工验收。

## 设计与数据限制

- 可辨识的大型越野 SUV 轮廓：高车头、平车顶、直立车尾、宽轮拱、横向镀铬格栅和三排侧窗。
- 外形以 2015 年改款 LC200 为参考，座舱按用户指定三排七座（2＋3＋2）。曲面、灯腔和内部铸件仍是程序化近似，不是扫描模型。发动机尚未锁定具体代码，不宣称精确复现某一市场的整车配置。
- 座舱和底盘、发动机、传动、悬架、排气均为**结构示意 / Schematic structure**，位置与形状不作为工程数据。
- 尚未实现车门铰链开合、悬架运动、真实维修顺序、GLB/GLTF 导出或尺寸编辑器；这些不是当前交互的前提。
- 达到 200–350 个 Mesh 的目标；结构件数量/名称/尺寸/展开路径未经 Toyota 验证。
- 只做桌面浏览器中的手机视口检查，**未经真实手机和双指触控实机验证**。
- 原创几何不意味着 LC200 汽车外观设计由本项目原创。车辆相关商标与设计权利归相应权利人。

## 本轮造型与结构修订

- 重建发动机盖隆起、车门肩线与曲面、轮拱、窗框、前后保险杠、宽幅格栅和灯组；补充轮罩内衬，修正饰条重叠和曲面法线。
- 机盖与翼子板肩部共用曲面边界，新增 82 点实际网格接缝检查，当前间隙约 5.10 个设计毫米；检查机盖镜像对称。格栅用带开孔的对称边框替代过冲样条。尾窗、尾门与后保险杠共用曲率基准。
- 车轮采用封闭轮胎截面、轮辋内筒、锥形分叉轮辐和金属合金材质；保留独立部件选择。
- 座舱采用三排七座：前排两个独立座位、第二排三座分体长椅、第三排两个座位。七个头枕可在座舱分类俯视下核对。
- 梯形车架采用起伏纵梁；前悬架为上下双叉臂与半轴；后悬架为整体桥、四根纵臂和横向定位杆。
- 动力系统呈现纵置 V8 双缸列、散热器、空气滤清器、变速箱、分动箱和前后传动轴；零件外形与安装点仍为结构示意。
- 后排底板在后桥上方抬高，第三排随之调整。座舱底板与防火墙归入座舱分类，底盘隔离时可直接看到机械布置。

### 参考资料

- [丰田官方 2015 改款 LC200 外观图](https://global.toyota/en/album/images/23388691/)：本轮实际查看前侧照片，校准车头、玻璃轮廓和车身肩线。
- [丰田新西兰 2016 LC200 配置信息](https://www.toyota.co.nz/about-toyota/toyota-news/2015/11/land-cruiser-200-adds-more-for-2016/)：官方资料区分 VX 八座和 VX Limited 七座。本项目采用用户指定七座布局。
- [丰田美国 LC200 底盘说明](https://pressroom.toyota.com/land-cruiser-marks-six-decades-in-toyota-dealerships-and-in-owners-hearts/)：非承载车身、前双叉臂、后四连杆螺旋弹簧悬架。

参考资料用于人工研究；网站没有加载或分发实车照片、Toyota CAD 或第三方车辆模型。研究尺寸和未锁定的动力配置仍有局限，不能据此维修或加工。

## 可复现性

项目没有离线模型缓存。删除 `dist/` 和 `reports/component-catalog.json` 等生成物后：

```bash
npm ci
npm run validate:production
```

即可重新生成目录与验证报告，并构建完整网站。浏览器从代码重新建立所有几何。截图属于人工浏览器验收记录，不由模型命令伪造。

## Vercel 生产部署

- 正式网站：https://york3d-lc200.vercel.app/
- 公开仓库：https://github.com/York8848/york3d-toyota-lc200
- Vercel 项目：York8848 / york3d-toyota-lc200。
- 生产分支：`main`。向该分支推送提交会由 Vercel Git 集成自动构建并更新正式网站。
- `vercel.json` 使用 Vite、`npm run build` 和 `dist`。无需环境变量或密钥。

已连接 GitHub 仓库 `York8848/york3d-toyota-lc200`，启用 Vercel 自动部署。GitHub App 安装范围限定为本仓库。日常更新先运行本地验证，再提交并推送至 `main`：

```bash
npm ci
npm run validate:production
git push origin main
```

正式短域名已添加到项目的生产域名，后续生产发布会沿用。默认域名 `york3d-toyota-lc200.vercel.app` 在本次网络中出现 DNS 解析异常，因此使用上面的正式短域名。短域名采用正常 DNS 和 TLS 验证，匿名首页、JS、CSS 与 favicon 均返回 200，资源与本地验收版本逐字节一致。详见 `reports/production-http-validation.json` 和 `reports/QA.md`。

## 参考与许可证

只参考了 <https://tina-3d-tesla.vercel.app/> 的布局和交互方式。模型、目录、Logo、CSS、纹理与代码均未从该站复制。YORK 标志与 favicon 是本项目自行编写的 SVG。

npm 库及其完整版权声明见 `THIRD_PARTY_LICENSES.md` 与 `THIRD_PARTY_LICENSES/`。没有沿用参考模型作者署名或 CC BY 声明。

项目原创代码和程序生成模型采用 [MIT License](LICENSE)。第三方依赖保留各自许可。Toyota、Land Cruiser 名称及徽标属于各自权利人；MIT 许可不授予任何商标权。本项目是非官方的造型与交互研究，不表示 Toyota 认可或合作。

## English overview

An unofficial Toyota LC200-inspired 3D study built with React, TypeScript, Vite and Three.js. All vehicle geometry is generated locally from code; there are no external vehicle assets or runtime API keys. The bilingual viewer supports 350 individually selectable components, category isolation, wireframe, exploded views and reset. The cabin uses a seven-seat 2+3+2 layout.

Run `npm ci` and `npm run dev` with Node.js 22.12+; run `npm run validate:production` before publishing. Vercel builds with `npm run build` and serves `dist`. This simplified model is not factory CAD, official parts data or a repair guide. Original code and geometry are MIT licensed; third-party licenses and trademark rights remain separate.

### 玻璃装配、车尾、越野胎与徽标修订

- 六块侧窗与前后风挡使用贴合边框，补齐车门肩面、车顶侧围及后柱包角；车门纵向轮廓间距从 21–23 mm 缩至 8 mm，扣除倒角后保留细分缝。
- 修正反射映射的三角形朝向，使风挡法线与面朝向一致；天窗贴合车顶曲面。
- 后部补上雨刷和徽标，修整牌照凹面、尾灯厚度、扰流板与保险杠踏面。
- 越野胎有 36 组错列胎块和胎肩凸筋，实际最大半径约 405 mm，与轮拱内缘的径向设计间距约 61 mm；未模拟转向、压缩行程或软胎变形。
- 前后徽标参考[丰田官方徽标说明与图例](https://global.toyota/en/mobility/toyota-brand/features/emblem/)，改成有宽度变化的镀铬轮廓和椭圆底座。网格自行生成，没有导入官方图像资产。
- 520 个玻璃周边采样点通过装配射线检查；350 件独立选择、展开与复位验证通过。详见 `reports/QA.md`。

### 前脸灯组装配修订

灯组与格栅开口统一到 `src/model/frontFascia.ts`。前保险杠表面围绕三个开口连续生成，轮廓留 4 mm 设计间隔；灯罩整体内收 14 mm，灯座改为向内收窄的薄壳，避免侧面露出黑色底座。透镜边框缩小并减薄，保险杠两端连接到翼子板下沿。前脸 220 个开口周边采样点通过实际网格射线检查。最新截图见 `reports/fascia-front.png` 和 `reports/fascia-perspective.png`。

### 前风挡贴合修订

扩大前风挡开口，缩窄玻璃两侧与上下沿留边；玻璃表面外移 5.5 mm，与框体表面齐平，并移除凸出的玻璃边缘圆管。车顶前段缩短到统一接合位置，用连续前横梁面连接风挡框，消除原先的叠层台阶。44 组实网格射线测得玻璃和框体相对共同曲面基准的最大深度差约 0.259 mm；这是模型设计检查，不代表真实汽车密封或制造公差。截图：`reports/windshield-flush-front.png`、`reports/windshield-flush-perspective.png`。

### 灯组、行李架和尾管最终修订

前后灯加入反光碗、透镜和红白分区，雾灯改为凸面光学件；行李架增加随车顶曲面贴合的六处安装脚；尾管具有环形管口、壁厚与暗色内腔。总数仍为 350 件。完整检查和截图见 `reports/QA.md` 最后一节，最新预览截图为 `reports/final-preview.png`。
