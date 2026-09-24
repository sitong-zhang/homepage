# 真实粒子地球 · Accurate Particle Earth

一个纯前端、零外链的 **Three.js 3D 粒子视觉系统**。星球由数十万颗圆形粒子构成，陆地轮廓来自 **Natural Earth 1:10m** 真实地理数据（world-atlas TopoJSON），不是程序噪声。

**核心交互**：摄像头手势识别（MediaPipe GestureRecognizer）——检测到手后，**地球粒子实时溶解变形为手部形状**（任意手势均可复刻，含握拳/比耶/点赞/张掌等），手离开画面后地球流回原状。

线上地址：<https://111qqq333www444.github.io/homepage/>

打开方式：必须通过 HTTP/HTTPS（直接双击 `file://` 会被 CORS 拦住本地数据）

```bash
python3 -m http.server 8000   # 然后访问 http://localhost:8000/
```

---

## 一、画面构成（从外到内）

| 层次 | 内容 | 说明 |
| --- | --- | --- |
| 表面 | 约 6 万颗陆地点（白色）+ 稀疏海洋点（蓝色） | 真实陆地轮廓，陆地统一白色，海洋深蓝 |
| 城市灯光 | 59 座真实城市 × 46 点（霓虹绿，加色混合） | 真实经纬度定位，**只在夜侧亮**，带轻微闪烁 |
| 城市名 | 中文标签（DOM 投影） | 面向相机 + 夜侧才浮现，38 px 内防重叠剔除 |
| 内部 | 4.5 万雾体 + 6 万辉光雾 | 一层淡蓝雾填满内部，整体压暗 |
| 环境 | 深空星尘 + 远处太阳 + 月球 | 星尘压暗闪烁；太阳带光晕；月球缓慢公转 |
| 手势指示球 | 顶部白色圆球（隔空手势风格） | 显示当前手势 SVG 图标 + 置信度弧光，无手缩回 |

**本版本不含以下元素**（简化画面的设计取舍）：
- ❌ 外层蓝色防护罩（菲涅尔球壳）
- ❌ 屏幕中央悬浮蓝圈
- ❌ 左下角摄像头预览小窗（取流在屏幕外进行，仅用于手势识别）

---

## 二、核心交互：地球 ↔ 手势变形（GPU 粒子 Morph）

### 工作机制

1. **粒子预分配**：每个地球粒子在构建时随机分配一个"手部骨骼归属"（`aSeg` 段索引、`aT` 段内位置、`aAngle` 绕骨轴角度、`aRadius` 距骨轴半径）
2. **手形骨架**：MediaPipe 返回 21 个手部关键点 + JS 计算 1 个掌心虚拟点（共 22 个，写入 `uJoints[22]` uniform）
3. **着色器变形**：顶点着色器按骨骼段圆柱采样计算每个粒子的"手形目标位置" `handPos`，然后用 `uMorph`（0=地球，1=手形）做 `mix(position, handPos, uMorph)` 溶解过渡
4. **实时跟手**：每帧 `onGestureResult` → `updateHandJoints(lm)` 更新 22 个关节坐标，手形实时跟随手势变化
5. **任意手势复刻**：只要有手的关键点（landmarks）就触发变形（`morphTarget = 1`），不依赖手势类别；手完全离开画面才回流（`morphTarget = 0`）

### 手形骨骼定义（当前 22 段）

```
索引：0=腕 1-4=拇指 5-8=食指 9-12=中指 13-16=无名指 17-20=小指 21=掌心虚拟点
每段 [起点关键点, 终点关键点, 半径, 权重]

手指全部从掌心虚拟点(21)伸出（[21,指根] 连接段），让手指与手掌连成一体；
手指半径加粗（0.20~0.26）+ 锥度（根部粗→指尖细，taper 0.55）；
掌心圆盘（段21，特殊处理）半径 1.00 + 动态 ×1.8，盖住所有指根。
```

### 关键参数

| 参数 | 值 | 说明 |
| --- | --- | --- |
| `HAND_PALM_LEN` | 1.4 | 手腕→中指根的世界距离目标值（控制手形大小） |
| `HAND_Z_SCALE` | 1.8 | 深度放大系数（z 方向层次） |
| `uMorph` 溶解速度 | 3.2 / 回流 2.2 | 溶解快、回流稍缓 |
| 掌心盘半径 | 指根距掌心平均 × 1.8 | 动态缩放，手大掌大 |
| 手形粒子放大 | ×1.6 | 手形时粒子更大更饱满 |

### ⚠️ shader 兼容性约束（重要）

**VERT 着色器必须保持简单结构**。曾尝试把掌心做成"多边形掌面"（6 个三角扇区 + if-else 链 + step 函数 + 复杂分支），结果**部分手机 GPU（如鸿蒙浏览器）编译失败 → 地球粒子整体消失**（陆地不见、只剩雾球轮廓）。

**当前约束**：
- shader 只允许 `if (si == 21)` 单分支（掌心圆盘特殊处理）
- 其余走统一圆柱采样 + 一行 taper 乘法
- 禁止：嵌套三元、多 if-else 链、`mod()` 后再 int、复杂数组索引
- 所有"更真"的改进优先在 **JS 数据层**（骨骼段定义、半径、权重、关节坐标）实现，不要堆 shader

---

## 三、手势识别（MediaPipe GestureRecognizer）

- **模型**：Google MediaPipe GestureRecognizer（浏览器端方案，官方 2.7 万★）
- **本地化**：`vendor/mediapipe/` 下全量部署（`vision_bundle.mjs` + `gesture_recognizer.task` 8.3MB + wasm×4），**零 CDN 依赖**
- **路径**：`GEST_WASM='./vendor/mediapipe/wasm'`，`GEST_MODEL='./vendor/mediapipe/gesture_recognizer.task'`
- **启动**：加载完成自动开启（`setTimeout(enableHands, 600)`），GPU delegate 失败自动降级 CPU 重试
- **识别 7 种手势**：Open_Palm(张掌) / Closed_Fist(握拳) / Pointing_Up(食指上指) / Thumb_Up(点赞) / Thumb_Down(拇指向下) / Victory(剪刀手) / ILoveYou(我爱你)
- **白色指示球**：`#gest-bubble` 顶部弹出，Twemoji SVG 图标 + 置信度 conic 弧光 + 呼吸脉冲
- **手势旋转控制**：张掌时手平移可旋转地球（`gestYaw -= smoothDX * K`，K=1.6，死区 0.012，EMA 平滑 0.7/0.3）

### 手势旋转实现要点

- 前置摄像头是**镜像画面**：手往左移 → cx 减小 → 需 `gestYaw -= dx`（负号对齐直觉）
- 增益取值 1.6（过大容易飘）
- 加死区（<0.012 忽略）+ EMA 平滑（单帧抖动只贡献 30%）防抖

---

## 四、陆地显示的关键实现

### 1. 陆地判定：光栅化查表

| 方案 | 单次耗时 | 20 万采样点 |
| --- | --- | --- |
| `d3.geoContains`（land-10m，40.9 万顶点） | ≈ 39 ms | 约 2 小时，浏览器必然卡死 |
| canvas 光栅化 + O(1) 查表 | ≈ 0.0002 ms | 32 ms |

把真实几何按**等距圆柱投影**画进 `2048×1024` canvas（0.176°/px），再按 `(lon, lat) → 像素` 查表。数据源仍是 Natural Earth 真实几何。

> 附带发现：world-atlas 的 land-10m 环缠绕方向与 d3 的球面约定不一致，`geoContains` 会把大西洋、几内亚湾、南太平洋也判成陆地（恒为 `true`）。

### 2. 光栅化的两个必要处理

- **反经线 ±180° 拆分**：经度跳变 > 180° 的边会在展开图上拉出横贯画面的直线
- **`fill('evenodd')`**：正确处理内湖（里海、五大湖等）

### 3. 白色陆地必须保持纯白

陆地粒子是白色（HSL(0,0,0.92)），但着色器夜侧 tint 是蓝色（`0.26,0.34,0.55`），`白色 × 蓝色 = 深蓝` → 白色陆地会被染成与海洋相同的颜色而**看不见**。

**当前方案**：VERT 里检测白色粒子（亮度 > 0.8 且近似无色）→ `tint = mix(tint, vec3(1.0), isWhiteLand)` 强制纯白。仅乘法 + step，**不影响 GPU 兼容性**。

```glsl
float lum = max(aColor.r, max(aColor.g, aColor.b));
float chroma = max(abs(aColor.r - aColor.g), max(abs(aColor.g - aColor.b), abs(aColor.b - aColor.r)));
float isWhiteLand = step(0.8, lum) * step(0.02, 1.0 - chroma);
tint = mix(tint, vec3(1.0), isWhiteLand);
```

### 4. 陆地粒子尺寸

陆地 `siz = 1.20`，海洋 `0.42 + rand*0.18`（陆地明显大于海洋，白色大陆清晰可见）

---

## 五、Service Worker（更新机制）

- **CACHE = `zjt-earth-v8`**（每次改代码必须**升级版本号**，否则浏览器用旧缓存）
- 预缓存：three.js 全家桶 + land-10m.json + **全部 MediaPipe 资源**（bundle/task/wasm×4）
- 策略：导航请求网络优先（保证 index.html 最新），静态资源缓存优先（大文件不走网络）
- **注意**：只改 index.html 不升 SW 版本 → 静态资源用旧缓存，MediaPipe 二进制与新版代码不匹配 → **手势识别失败**。升级版本号（v7→v8）强制清旧缓存解决
- **浏览器强刷须知**：Ctrl+Shift+R 或清缓存才能看到新版；SW 升级需"访问两次"才完全生效（第一次装新 SW，第二次生效）

---

## 六、文件结构

```
index.html                 主页面（HTML + CSS + 着色器 + 全部逻辑，单文件）
sw.js                      Service Worker：CACHE = zjt-earth-v8
README.md                  本文档
vendor/
  land-10m.json            Natural Earth 1:10m 陆地 TopoJSON（3.0 MB）
  topojson-client.min.js   TopoJSON → GeoJSON
  d3-geo.min.js            球面几何（备用判定 / 校验）
  d3-array.min.js          d3-geo 依赖
  three/                   three.js r160 + OrbitControls + 后处理链
  mediapipe/               GestureRecognizer 全量本地化（bundle + task + wasm×4）
  gesture-icons/           Twemoji 手势 SVG（270b/270a/270c/1f44d/1f44e/261d/1f91f/1f590）
```

---

## 七、技术栈与关键参数

- **Three.js r160** + 自写 GLSL 着色器 + OrbitControls + EffectComposer/UnrealBloomPass(0.34, 0.50, 0.74)
- **TopoJSON**（Natural Earth 1:10m，3MB）+ d3-geo 光栅化
- **CFG**：radius=2.0，targetSamples=200000，oceanKeep=0.02，fogCount=45000，mistCount=60000
- **相机**：camera(0, 1.6, 6.8)，地轴倾角 23.5°（tilt.rotation.z = TILT）
- **颜色**：陆地白 HSL(0,0,0.92)、海洋深蓝、城市霓虹绿 HSL(0.33)、手形暖白
- **导入**：importmap 映射 `@mediapipe/tasks-vision` → 本地 `vision_bundle.mjs`

---

## 八、仓库维护

- **仓库**：`homepage`（粒子地球，main 分支）——线上 <https://111qqq333www444.github.io/homepage/>
- 关联仓库：`farewell`（UI 图标资源库）、`zjt-labs`（维护页）
- **更新方式**：GitHub API `PUT /repos/{owner}/{repo}/contents/{path}`（base64 content + sha + branch=main），先 GET 拿 sha 再 PUT

---

## 九、当前状态与待办

| 项 | 状态 |
| --- | --- |
| 真实陆地轮廓（白色大陆 + 蓝色海洋） | ✅ |
| 地球 → 手势变形（GPU 粒子 Morph） | ✅ 任意手势复刻 |
| 实时跟手 | ✅ |
| 白色手势指示球 | ✅ |
| Twemoji SVG 手势图标 | ✅ |
| 无手势白球缩回 + 地球回流 | ✅ |
| 蓝色防护罩 / 悬浮圆圈 | — 未采用（简化设计） |
| 摄像头小窗 | — 隐藏（取流在屏幕外） |
| **手形仿真度**（核心待优化） | ⚠️ 仍不够像：掌心是圆盘感、手指粗细待调、拇指位置待优化 |
| 手势方向识别精度 | ⚠️ 基本可用，偶发反向/幅度问题 |
| 预设模型切换（星云/烟花/土星/花朵） | ⏳ 未做 |
| 城市灯光分级亮度 | ⏳ 未做 |

### 后续优化方向

1. **手形仿真度是核心目标**，当前是"圆盘掌心 + 圆柱手指"方案。安全改进路线：
   - JS 层调骨骼段：手指半径、掌心盘动态系数（×1.8 → 可调）、拇指连接段方向
   - 掌心圆盘 → 椭圆盘（shader 一行乘法，兼容安全）
   - 手指加"指腹"段（每指节末端加粗再 taper）
   - 注意：不要上复杂 shader 分支（多边形掌面曾导致地球消失）
2. 手势旋转：可加"手形识别置信度加权"，低置信度不旋转
3. Service Worker 每次发布记得升版本号

---

## 十、性能实测

```
加载 land-10m.json   159 ms
光栅化 2048×1024     137 ms
20 万采样点陆地判定    32 ms
陆地采样点            58,457
陆地占比              29.23%  ← 真实地球陆地占比 29.2%
城市经纬度命中陆地     59 / 59  ✅
```
