import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Box,
  CarFront,
  Check,
  ChevronRight,
  CircleDot,
  Focus,
  Info,
  Layers,
  Lightbulb,
  Maximize,
  Minus,
  MousePointer2,
  Plus,
  RotateCcw,
  ScanLine,
  Search,
  Settings2,
  Shield,
  X,
  Armchair,
  Orbit,
} from "lucide-react";
import { VehicleScene } from "./scene/VehicleScene";
import { initialSceneState, SceneController } from "./scene/SceneController";
import type { SceneState, View } from "./scene/SceneController";
import type { Vehicle } from "./model/buildVehicle";
import { categories, categoryLabels } from "./model/parameters";
import type { Category } from "./model/parameters";
const icons = {
  body: CarFront,
  glass: ScanLine,
  lights: Lightbulb,
  wheels: CircleDot,
  cabin: Armchair,
  structure: Shield,
};
function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className={wide ? "wide" : ""}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button
          aria-label={
            title.includes("部件") || title.includes("关于") ? "关闭" : "Close"
          }
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export default function App() {
  const [lang, setLang] = useState<"zh" | "en">("zh"),
    [state, setState] = useState<SceneState>({ ...initialSceneState }),
    [vehicle, setVehicle] = useState<Vehicle | null>(null),
    [catalog, setCatalog] = useState(false),
    [about, setAbout] = useState(false),
    [query, setQuery] = useState(""),
    [catalogCat, setCatalogCat] = useState<Category | "all">("all"),
    [view, setView] = useState<View>("perspective");
  const controller = useRef<SceneController | null>(null);
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const change = (patch: Partial<SceneState>) =>
    setState((s) => ({ ...s, ...patch }));
  const selected = vehicle?.parts.find((p) => p.id === state.selected),
    parts = vehicle?.parts ?? [];
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.title = `York3D Toyota LC200 · ${lang === "zh" ? "造型研究" : "Styling study"}`;
  }, [lang]);
  const reset = () => {
    setState({ ...initialSceneState });
    setView("perspective");
    controller.current?.reset();
  };
  const explode = (n: number) => {
    if (controller.current) controller.current.userOrbit = false;
    change({ explosion: n });
  };
  const select = (id: string | null) => change({ selected: id });
  const pickCatalog = (id: string) => {
    change({ selected: id, category: "all", isolated: null });
    setCatalog(false);
  };
  const setPreset = (v: View) => {
    setView(v);
    controller.current?.setView(v);
  };
  const filtered = parts.filter(
    (p) =>
      (catalogCat === "all" || p.category === catalogCat) &&
      `${p.id} ${p.nameEn} ${p.nameZh}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const ready = !!vehicle;
  return (
    <div className="app">
      <header>
        <a
          className="brand"
          href="#"
          aria-label="York3D"
          onClick={(e) => e.preventDefault()}
        >
          <img src="/york.svg" alt="YORK" />
          <span>3D LAB</span>
        </a>
        <span className="project-name">York3D Toyota LC200</span>
        <div className="header-actions">
          <button
            aria-label={t("关于", "About")}
            onClick={() => setAbout(true)}
          >
            <Info size={16} />
            <span>{t("关于", "About")}</span>
          </button>
          <button
            className="language"
            aria-label={t("Switch to English", "切换中文")}
            onClick={() => setLang((l) => (l === "zh" ? "en" : "zh"))}
          >
            <b className={lang === "zh" ? "active" : ""}>中</b>
            <span>/</span>
            <b className={lang === "en" ? "active" : ""}>EN</b>
          </button>
        </div>
      </header>
      <main>
        <section
          className="stage"
          aria-label={t("三维车辆展台", "3D vehicle studio")}
        >
          <div className="stage-title">
            <div className="eyebrow">
              TOYOTA LAND CRUISER <span> / </span> 200 SERIES
            </div>
            <h1>
              LC200 <span>{t("造型研究", "Styling study")}</span>
            </h1>
            <div className="model-badge">
              <span />
              {t("原创简化模型", "Original simplified model")}
            </div>
          </div>
          <VehicleScene
            state={state}
            lang={lang}
            onReady={setVehicle}
            onSelect={select}
            controller={controller}
          />
          <div className="stage-index">
            STUDY <b>001</b>
          </div>
          <div className="scene-tools">
            <button
              title={t("适应视图", "Fit view")}
              aria-label={t("适应视图", "Fit view")}
              onClick={() => controller.current?.fit()}
            >
              <Maximize />
            </button>
            <span />
            <button
              aria-label={t("放大", "Zoom in")}
              title={t("放大", "Zoom in")}
              onClick={() => controller.current?.zoom(0.82)}
            >
              <Plus />
            </button>
            <button
              aria-label={t("缩小", "Zoom out")}
              title={t("缩小", "Zoom out")}
              onClick={() => controller.current?.zoom(1.22)}
            >
              <Minus />
            </button>
            <span />
            <button
              aria-label={t("自动旋转", "Auto rotate")}
              title={t("自动旋转", "Auto rotate")}
              aria-pressed={state.autoRotate}
              onClick={() => change({ autoRotate: !state.autoRotate })}
            >
              <Orbit />
            </button>
            <button
              aria-label={t("线框", "Wireframe")}
              title={t("线框", "Wireframe")}
              aria-pressed={state.wireframe}
              onClick={() => change({ wireframe: !state.wireframe })}
            >
              <Box />
            </button>
          </div>
          {state.isolated && (
            <button
              className="isolate-pill"
              onClick={() => change({ isolated: null })}
            >
              <Focus size={15} />
              {t("单件隔离", "Component isolated")} · {state.isolated}
              <X size={15} />
            </button>
          )}
          <div className="stage-bottom">
            <div className="mesh-stat">
              <strong>{ready ? parts.length : "—"}</strong>
              <span>
                {t("个可交互网格部件", "interactive mesh components")}
              </span>
            </div>
            <div className="view-presets">
              {(["perspective", "front", "side", "top"] as View[]).map(
                (v, i) => (
                  <button
                    key={v}
                    aria-pressed={view === v}
                    onClick={() => setPreset(v)}
                  >
                    {t(
                      ["透视", "正面", "侧面", "俯视"][i],
                      ["Perspective", "Front", "Side", "Top"][i],
                    )}
                  </button>
                ),
              )}
            </div>
          </div>
          <div className="gesture-hint">
            <MousePointer2 size={12} />
            {t(
              "拖动旋转 · 滚轮缩放 · 点击选择部件",
              "Drag to orbit · Scroll to zoom · Click to select",
            )}
          </div>
        </section>
        <aside aria-label={t("模型控制面板", "Model controls")}>
          <div className="panel-head">
            <div>
              <span className="eyebrow">EXPLORER</span>
              <h2>{t("探索车辆", "Explore the vehicle")}</h2>
            </div>
            <Settings2 size={19} />
          </div>
          <section className="panel-section">
            <div className="section-label">
              <h3>{t("视觉展开", "Exploded view")}</h3>
              <span className="blue-value">
                {state.explosion}
                <small>%</small>
              </span>
            </div>
            <div className="segmented">
              <button
                className={state.explosion === 0 ? "chosen" : ""}
                onClick={() => explode(0)}
              >
                <CarFront size={16} />
                {t("整车", "Assembled")}
              </button>
              <button
                className={state.explosion > 0 ? "chosen" : ""}
                onClick={() => explode(100)}
              >
                <Layers size={16} />
                {t("展开", "Exploded")}
              </button>
            </div>
            <input
              className="explosion-slider"
              aria-label={t("视觉展开程度", "Explosion progress")}
              type="range"
              min="0"
              max="100"
              value={state.explosion}
              onChange={(e) => explode(Number(e.target.value))}
              style={
                { "--progress": `${state.explosion}%` } as React.CSSProperties
              }
            />
            <div className="range-labels">
              <button onClick={() => explode(0)}>
                {t("完整", "Assembled")}
              </button>
              <button onClick={() => explode(50)}>
                {t("分解", "Separated")}
              </button>
              <button onClick={() => explode(100)}>
                {t("部件阵列", "Component array")}
              </button>
            </div>
            <p className="fineprint">
              {t(
                "原创模型的视觉展开，非真实拆装顺序",
                "Visual exploded view of the simplified model, not an actual mechanical disassembly sequence.",
              )}
            </p>
          </section>
          <section className="panel-section categories">
            <div className="section-label">
              <h3>{t("部件系统", "Component systems")}</h3>
              <span>06</span>
            </div>
            <button
              className={
                "category all " + (state.category === "all" ? "chosen" : "")
              }
              onClick={() => change({ category: "all", isolated: null })}
            >
              <Layers size={16} />
              <span>{t("全部部件", "All components")}</span>
              <small>{parts.length}</small>
            </button>
            <div className="category-grid">
              {categories.map((c) => {
                const Icon = icons[c];
                return (
                  <button
                    className={
                      "category " + (state.category === c ? "chosen" : "")
                    }
                    key={c}
                    onClick={() => change({ category: c, isolated: null })}
                  >
                    <Icon size={16} />
                    <span>{categoryLabels[c][lang === "zh" ? 0 : 1]}</span>
                    <small>
                      {parts.filter((p) => p.category === c).length}
                    </small>
                  </button>
                );
              })}
            </div>
            <label className="switch-row">
              <span>{t("仅显示当前分类", "Isolate category")}</span>
              <input
                type="checkbox"
                checked={state.categoryMode === "isolate"}
                onChange={(e) =>
                  change({
                    categoryMode: e.target.checked ? "isolate" : "highlight",
                  })
                }
              />
              <span className="switch" />
            </label>
          </section>
          <section className="selection-card" aria-live="polite">
            {selected ? (
              <>
                <div className="selection-top">
                  <span className="eyebrow">
                    {t("网格 ID", "MESH ID")} · {selected.id}
                  </span>
                  <button
                    aria-label={t("取消选择", "Clear selection")}
                    onClick={() => change({ selected: null, isolated: null })}
                  >
                    <X size={14} />
                  </button>
                </div>
                <h3>{lang === "zh" ? selected.nameZh : selected.nameEn}</h3>
                <p>{lang === "zh" ? selected.nameEn : selected.nameZh}</p>
                <div className="part-tags">
                  <span>
                    {categoryLabels[selected.category][lang === "zh" ? 0 : 1]}
                  </span>
                  <span>
                    {selected.representation === "schematic-structure"
                      ? t("结构示意", "Schematic structure")
                      : t("外观简化", "Simplified exterior")}
                  </span>
                </div>
                <div className="selection-actions">
                  <button
                    onClick={() =>
                      change({ isolated: state.isolated ? null : selected.id })
                    }
                  >
                    <Focus size={14} />
                    {state.isolated
                      ? t("退出隔离", "Show all")
                      : t("隔离", "Isolate")}
                  </button>
                  <button onClick={() => controller.current?.fit(selected.id)}>
                    <Maximize size={14} />
                    {t("适应视图", "Fit view")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="selection-empty">
                  <MousePointer2 size={21} />
                  <h3>
                    {t("从整车，到每一处细节", "From silhouette to detail")}
                  </h3>
                </div>
                <p>
                  {t(
                    "点击车辆部件，或从目录中选择。",
                    "Select a mesh in the viewport or browse the catalog.",
                  )}
                </p>
              </>
            )}
          </section>
          <div className="panel-bottom">
            <button
              className="catalog-button"
              onClick={() => {
                setCatalogCat(state.category);
                setCatalog(true);
              }}
              disabled={!ready}
            >
              <BookOpen size={17} />
              <span>{t("部件目录", "Component catalog")}</span>
              <small>{parts.length}</small>
              <ArrowUpRight size={16} />
            </button>
            <button className="reset-button" onClick={reset}>
              <RotateCcw size={15} />
              {t("重置全部视图", "Reset all views")}
            </button>
            <div className="internal-id-note">
              {t(
                "GEN 编号为项目内部编号",
                "GEN IDs are internal project identifiers",
              )}
            </div>
          </div>
        </aside>
      </main>
      <footer>
        <span>
          <b>YORK AI</b> <span className="footer-divider">/</span>{" "}
          {t(
            "独立设计探索，非丰田官方产品。",
            "Independent design exploration. Not affiliated with Toyota.",
          )}
        </span>
        <button onClick={() => setAbout(true)}>
          {t("模型说明", "Model notes")}
          <ChevronRight size={12} />
        </button>
      </footer>
      {catalog && (
        <Modal
          title={t("部件目录", "Component catalog")}
          onClose={() => setCatalog(false)}
          wide
        >
          <div className="catalog-controls">
            <label className="search">
              <Search size={17} />
              <input
                autoFocus
                aria-label={t("搜索部件", "Search components")}
                placeholder={t("搜索名称或 GEN 编号", "Search name or GEN ID")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              aria-label={t("目录分类", "Catalog category")}
              value={catalogCat}
              onChange={(e) =>
                setCatalogCat(e.target.value as Category | "all")
              }
            >
              <option value="all">{t("全部分类", "All categories")}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {categoryLabels[c][lang === "zh" ? 0 : 1]}
                </option>
              ))}
            </select>
          </div>
          <div className="catalog-meta">
            {filtered.length} / {parts.length}{" "}
            {t(
              "个网格部件 · GEN 编号不是 Toyota 官方零件号",
              "mesh components · GEN IDs are not Toyota part numbers",
            )}
          </div>
          <div className="catalog-list">
            {filtered.map((p) => (
              <button
                key={p.id}
                className={p.id === state.selected ? "selected" : ""}
                onClick={() => pickCatalog(p.id)}
              >
                <span className="catalog-id">{p.id}</span>
                <span className="catalog-names">
                  <strong>{lang === "zh" ? p.nameZh : p.nameEn}</strong>
                  <small>{lang === "zh" ? p.nameEn : p.nameZh}</small>
                </span>
                <span className="catalog-type">
                  {categoryLabels[p.category][lang === "zh" ? 0 : 1]}
                </span>
                {p.id === state.selected ? (
                  <Check size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="no-results">
                {t("没有匹配的部件", "No matching components")}
              </p>
            )}
          </div>
        </Modal>
      )}
      {about && (
        <Modal
          title={t("关于模型", "About the model")}
          onClose={() => setAbout(false)}
        >
          <div className="about-content">
            <img src="/york.svg" width="116" alt="YORK" />
            <h3>York3D Toyota LC200</h3>
            <p>
              {t(
                "原创简化模型，由本项目自己的 TypeScript 参数化程序生成。Toyota Land Cruiser LC200 仅作为车辆外观比例与造型研究参考。",
                "Original simplified model generated by this project’s own parametric TypeScript program. Toyota Land Cruiser LC200 is a reference for proportions and exterior styling research.",
              )}
            </p>
            <p>
              {t(
                "造型参考 2015 年改款 LC200，座舱采用三排七座（2＋3＋2）。底盘呈现梯形车架、前双叉臂、后四连杆整体桥，以及纵置 V8 与四驱传动布局。",
                "Styling references the 2015 LC200 facelift, with a seven-seat cabin (2+3+2). The chassis shows a ladder frame, front double wishbones, a four-link live rear axle, a longitudinal V8 and four-wheel-drive layout.",
              )}
            </p>
            <p>
              {t(
                "外观与内部结构均经过简化。座舱、底盘、悬架、发动机与传动系统属于结构示意。部件数量、名称、尺寸与展开路径均未经 Toyota 验证。",
                "Exterior and internal structures are simplified. Cabin, chassis, suspension, engine and drivetrain are schematic structures. Component counts, names, dimensions and explosion paths have not been validated by Toyota.",
              )}
            </p>
            <p>
              {t(
                "GEN 编号是项目内部编号，不是 Toyota 官方零件号。本项目不是原厂 CAD、EPC 模型或官方数字孪生，不适用于维修、制造或工程设计。",
                "GEN IDs are internal identifiers, not Toyota part numbers. This is not factory CAD, an EPC model or an official digital twin, and is not suitable for repair, manufacturing or engineering design.",
              )}
            </p>
            <p>
              {t(
                "原创几何不代表 Toyota LC200 外观设计由本项目原创，车辆设计知识产权属于相应权利人。本项目未使用参考站的模型、目录、Logo 或纹理资产。",
                "Original geometry does not imply authorship of the LC200 vehicle design. Vehicle design rights belong to their respective owners. No model, catalog, logo or texture assets from the reference website are used.",
              )}
            </p>
            <div className="about-stats">
              <span>
                <b>{parts.length}</b>
                {t("网格部件", "Mesh components")}
              </span>
              <span>
                <b>{vehicle?.triangles.toLocaleString()}</b>
                {t("三角面", "Triangles")}
              </span>
            </div>
            <p className="fineprint">
              React · Three.js · TypeScript · Vite
              <br />
              {t(
                "依赖许可证见项目 THIRD_PARTY_LICENSES。",
                "Dependency licenses: THIRD_PARTY_LICENSES in the project.",
              )}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
