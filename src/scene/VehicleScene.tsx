import { useEffect, useRef, useState } from "react";
import { buildVehicle } from "../model/buildVehicle";
import type { Vehicle } from "../model/buildVehicle";
import { SceneController } from "./SceneController";
import type { SceneState } from "./SceneController";
interface Props {
  state: SceneState;
  lang: "zh" | "en";
  onReady: (v: Vehicle) => void;
  onSelect: (id: string | null) => void;
  controller: React.RefObject<SceneController | null>;
}
const stages = [
  ["正在初始化", "Initializing"],
  ["正在生成车辆几何", "Generating vehicle geometry"],
  ["正在建立部件目录", "Building component catalog"],
  ["正在准备 WebGL 场景", "Preparing WebGL scene"],
];
export function VehicleScene({
  state,
  lang,
  onReady,
  onSelect,
  controller,
}: Props) {
  const host = useRef<HTMLDivElement>(null),
    callbacks = useRef({ onReady, onSelect });
  callbacks.current = { onReady, onSelect };
  const [stage, setStage] = useState(0),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true,
      engine: SceneController | undefined,
      vehicle: Vehicle | undefined;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const next = (fn: () => void) => timers.push(setTimeout(fn, 30));
    setError("");
    setStage(0);
    next(() => {
      if (!active) return;
      setStage(1);
      next(() => {
        if (!active) return;
        try {
          vehicle = buildVehicle();
          setStage(2);
          next(() => {
            if (!active) return;
            callbacks.current.onReady(vehicle!);
            setStage(3);
            next(() => {
              if (!active) return;
              try {
                engine = new SceneController(
                  host.current!,
                  vehicle!,
                  (id) => callbacks.current.onSelect(id),
                  setError,
                );
                controller.current = engine;
                setStage(4);
              } catch (e) {
                vehicle?.dispose();
                setError(String(e));
              }
            });
          });
        } catch (e) {
          vehicle?.dispose();
          setError(String(e));
        }
      });
    });
    return () => {
      active = false;
      timers.forEach(clearTimeout);
      engine?.dispose();
      if (!engine) vehicle?.dispose();
      controller.current = null;
    };
  }, [attempt, controller]);
  useEffect(() => {
    controller.current?.update(state);
  }, [state, stage, controller]);
  return (
    <>
      <div className="canvas-host" ref={host} data-testid="viewport" />
      {(stage < 4 || error) && (
        <div className="scene-status" role={error ? "alert" : "status"}>
          {error ? (
            <>
              <strong>
                {lang === "zh"
                  ? "无法准备三维场景"
                  : "Unable to prepare the 3D scene"}
              </strong>
              <p>
                {lang === "zh"
                  ? "请检查浏览器 WebGL 支持，或重试。"
                  : "Check browser WebGL support or retry."}
              </p>
              <details>
                <summary>
                  {lang === "zh" ? "错误详情" : "Error details"}
                </summary>
                {error}
              </details>
              <button onClick={() => setAttempt((a) => a + 1)}>
                {lang === "zh" ? "重试" : "Retry"}
              </button>
            </>
          ) : (
            <>
              <span className="spinner" />
              {stages[stage]?.[lang === "zh" ? 0 : 1]}
            </>
          )}
        </div>
      )}
    </>
  );
}
