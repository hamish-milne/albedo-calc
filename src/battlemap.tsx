import {
  createContext,
  useContext,
  useRef,
  type ComponentProps,
  type PointerEvent,
  type PointerEventHandler,
  type PropsWithoutRef,
  type ReactNode,
  type Ref,
  type RefCallback,
  type SVGProps,
} from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { getPos, type MarkerType, type SelectForm } from "./schema";
import { MapForm } from "./custom-forms";
import { DefaultChar, DefaultValues } from "./data";
import { Step, useCalcs } from "./calc-provider";
import type { Circle } from "./rules";
import { vec2 } from "gl-matrix";

const DraggableContext = createContext<{
  setHeld: (el: DragHandler) => void;
}>({
  setHeld() {
    throw new Error();
  },
});

const LMOUSE = 0;

type DragHandler = PointerEventHandler;

export function DraggableProvider(props: {
  children: (props: {
    onPointerMove: PointerEventHandler;
    onPointerUp: PointerEventHandler;
    onPointerLeave: PointerEventHandler;
    ref: RefCallback<Element>;
  }) => ReactNode;
}) {
  const { children } = props;

  const held = useRef<DragHandler | null>(null);

  function update(e: PointerEvent) {
    const { current } = held;
    current?.(e);
    if ((e.buttons & (1 << LMOUSE)) === 0) {
      held.current = null;
    }
    e.preventDefault();
  }

  return (
    <DraggableContext.Provider
      value={{
        setHeld(el) {
          held.current = el;
        },
      }}
    >
      {children({
        onPointerMove: update,
        onPointerUp: update,
        onPointerLeave: update,
        ref: (e) =>
          e?.addEventListener("touchmove", (e) => e.preventDefault(), {
            passive: false,
          }),
      })}
    </DraggableContext.Provider>
  );
}

export function Draggable(props: {
  children: (props: { onPointerDown: PointerEventHandler }) => ReactNode;
  handler: DragHandler;
}) {
  const { children, handler } = props;
  const { setHeld } = useContext(DraggableContext);

  return children({
    onPointerDown(e) {
      if (e.button === LMOUSE) {
        setHeld(handler);
        handler(e);
      }
    },
  });
}

type SVGDragHandler<TEl> = (
  e: PointerEvent,
  svg: TEl,
  pos: { x: number; y: number }
) => { x: number; y: number };

export function DraggableSVG<TEl extends SVGGraphicsElement>(props: {
  handler: SVGDragHandler<TEl>;
  children: (props: {
    onPointerDown: PointerEventHandler;
    ref: Ref<TEl>;
  }) => ReactNode;
}) {
  const { handler, children } = props;
  const ref = useRef<TEl | null>(null);
  const dragState = useRef<[number, number]>(undefined);

  return (
    <Draggable
      handler={(e) => {
        const { current } = ref;
        if (!current) {
          return;
        }
        const rect = current.getBoundingClientRect();
        if (e.type === "pointerdown") {
          const x0 = e.clientX - rect.x;
          const y0 = e.clientY - rect.y;
          dragState.current = [x0, y0];
        } else {
          if (!dragState.current) {
            return;
          }
          const [x0, y0] = dragState.current;
          const dx = e.clientX - rect.x - x0;
          const dy = e.clientY - rect.y - y0;
          const list = current.transform.baseVal;
          if (
            list[list.length - 1]?.type !== SVGTransform.SVG_TRANSFORM_TRANSLATE
          ) {
            let root: ParentNode = current;
            while (!(root instanceof SVGSVGElement)) {
              root = root.parentNode!;
            }
            list.appendItem(root.createSVGTransform());
            list[list.length - 1].setTranslate(0, 0);
          }
          const t = list[list.length - 1];
          const { x, y } = handler(e, current, {
            x: t.matrix.e + dx,
            y: t.matrix.f + dy,
          });
          t.setTranslate(x, y);
        }
      }}
    >
      {(inner) => children({ ...inner, ref })}
    </Draggable>
  );
}

function toNearest(raw: number, bin: number) {
  bin = Math.max(bin, 0.01);
  return Math.round(raw / bin) * bin;
}

function Marker(
  props: {
    type: MarkerType;
    size: number;
    ref?: RefCallback<SVGGraphicsElement>;
  } & PropsWithoutRef<SVGProps<SVGGraphicsElement>>
) {
  const { type, size, ref, ...svgProps } = props;
  const r = size / 2;
  switch (type) {
    default:
    case "Circle":
      return <circle ref={ref} r={r} {...svgProps} />;
    case "Square":
      return (
        <rect
          ref={ref}
          x={-r}
          y={-r}
          width={size}
          height={size}
          {...svgProps}
        />
      );
    case "Triangle":
      return (
        <polygon
          ref={ref}
          points={`${-r},${r} 0,${-r} ${r},${r}`}
          {...svgProps}
        />
      );
    case "Cross":
      return (
        <path
          d={`M ${-r},${-r} L ${r},${r} M ${r},${-r} L ${-r},${r}`}
          {...svgProps}
        />
      );
    case "Star":
      return (
        <path
          d="m25,1 6,17h18l-14,11 5,17-15-10-15,10 5-17-14-11h18z"
          transform="scale(0.3) translate(-25, -25)"
          {...svgProps}
          strokeWidth={Number(svgProps.strokeWidth || 1) / 0.3}
        />
      );
  }
}

function CharMarker(
  props: {
    idx: number;
    snap: number;
    pixelsPerUnit: number;
    form: UseFormReturn<SelectForm>;
  } & ComponentProps<"g">
) {
  const { idx, snap, pixelsPerUnit, form, ...gProps } = props;
  const character = useWatch({
    control: form.control,
    name: `character.list.${idx}`,
    defaultValue: DefaultChar,
  });
  const position = getPos(character);

  const px = position.x * pixelsPerUnit;
  const py = position.y * pixelsPerUnit;

  const markerSize = 10;
  const dragRegionSize = markerSize + 8;

  return (
    <DraggableSVG
      handler={(e, _svg, pos) => {
        if (e.buttons) {
          return pos;
        }
        const newPos = {
          x: toNearest(pos.x, snap),
          y: toNearest(pos.y, snap),
        };
        form.setValue(`character.list.${idx}.position`, {
          x: newPos.x / pixelsPerUnit,
          y: newPos.y / pixelsPerUnit,
        });
        return newPos;
      }}
    >
      {(inner) => (
        <g {...inner} transform={`translate(${px},${py})`} {...gProps}>
          <Marker
            size={10}
            fill={character.color}
            className="stroke-foreground"
            type={character.marker}
          />
          <text
            y={-20}
            textAnchor="middle"
            className="fill-foreground cursor-default pointer-events-none filter-shadow"
          >
            {character.name}
          </text>
          <rect
            x={-dragRegionSize / 2}
            y={-dragRegionSize / 2}
            width={dragRegionSize}
            height={dragRegionSize}
            className="fill-none cursor-move pointer-events-bounding-box"
          />
        </g>
      )}
    </DraggableSVG>
  );
}

function CombatLine(props: {
  form: UseFormReturn<SelectForm>;
  pixelsPerUnit: number;
}) {
  const { form, pixelsPerUnit } = props;

  const combat = useWatch({
    control: form.control,
    name: "setup",
    defaultValue: {},
  });
  const characters = useWatch({
    control: form.control,
    name: "character.list",
    defaultValue: [],
  });

  const attacker = characters[combat.attacker ?? -1];
  const defender = characters[combat.defender ?? -1];
  const line =
    attacker && defender ? [getPos(attacker), getPos(defender)] : undefined;

  return line ? (
    <line
      x1={line[0].x * pixelsPerUnit}
      y1={line[0].y * pixelsPerUnit}
      x2={line[1].x * pixelsPerUnit}
      y2={line[1].y * pixelsPerUnit}
      className="stroke-foreground"
    />
  ) : (
    <></>
  );
}

function DrawCircle(
  props: {
    def: Circle;
    pixelsPerUnit: number;
  } & ComponentProps<"circle">
) {
  const { def, pixelsPerUnit, ...cProps } = props;
  return (
    <circle
      cx={def.c[0] * pixelsPerUnit}
      cy={def.c[1] * pixelsPerUnit}
      r={def.r * pixelsPerUnit}
      {...cProps}
    />
  );
}

function ExplosionMarker(props: {
  form: UseFormReturn<SelectForm>;
  pixelsPerUnit: number;
}) {
  const { form, pixelsPerUnit } = props;
  const { center, radius } = useWatch({
    control: form.control,
    name: "explosion",
    defaultValue: { center: [0, 0], radius: 0 },
  });
  return (
    <>
      {[1, 2, 3, 4, 5].map((x) => (
        <DrawCircle
          def={{ c: center as [number, number], r: radius * x }}
          pixelsPerUnit={pixelsPerUnit}
          className="fill-red-500 opacity-10"
        />
      ))}
    </>
  );
}

function ExplosionCandidate(props: {
  form: UseFormReturn<SelectForm>;
  pixelsPerUnit: number;
}) {
  const { form, pixelsPerUnit } = props;
  const values = useWatch({
    control: form.control,
    defaultValue: DefaultValues,
  }) as SelectForm;
  const calcs = useCalcs(values);

  if (calcs.step !== Step.Explosion) {
    return <></>;
  }
  const { explosion } = calcs;
  // TODO: Remove the below? only happens when using a bad roll type. Should be an error instead!
  if (typeof explosion === "string") {
    return <></>;
  }
  if (explosion.target.r < 1) {
    const p = vec2.scale([0, 0], explosion.target.c, pixelsPerUnit);
    return (
      <Marker
        type="Cross"
        size={20}
        transform={`translate(${p[0]},${p[1]})`}
        className="stroke-lime-500 dark:stroke-lime-400 stroke-2"
      />
    );
  }
  return (
    <>
      {explosion.maximum ? (
        <DrawCircle
          def={explosion.maximum}
          pixelsPerUnit={pixelsPerUnit}
          className="fill-blue-500 opacity-20"
        />
      ) : undefined}
      <DrawCircle
        def={explosion.target}
        pixelsPerUnit={pixelsPerUnit}
        className="fill-lime-400 opacity-20"
      />
    </>
  );
}

export function BattleMap(props: { form: UseFormReturn<SelectForm> }) {
  const { form } = props;
  const characters = form.getValues("character.list");

  const config = useWatch({
    control: form.control,
    name: "map",
    defaultValue: {},
  });
  const pixelsPerUnit = config.pixelsPerUnit || 20;
  const snap = (config.snap || 1) * pixelsPerUnit;
  const gridCellSize = (config.gridCellSize || 1) * pixelsPerUnit;
  const width = (config.width || 25) * pixelsPerUnit;
  const height = (config.height || 25) * pixelsPerUnit;

  return (
    <>
      <div className="flex gap-2 flex-wrap *:flex-1 *:min-w-24">
        <MapForm form={form} />
      </div>
      <div className="overflow-x-auto">
        <DraggableProvider>
          {(props) => (
            <svg width={width} height={height} {...props} className="m-auto">
              <defs>
                <pattern
                  width={gridCellSize}
                  height={gridCellSize}
                  id="battleGrid"
                  patternUnits="userSpaceOnUse"
                >
                  <rect
                    width={gridCellSize}
                    height={gridCellSize}
                    fill="none"
                    className="stroke-gray-300 dark:stroke-gray-500"
                  />
                </pattern>
              </defs>
              <rect width={width} height={height} fill="url(#battleGrid)" />
              <ExplosionMarker form={form} pixelsPerUnit={pixelsPerUnit} />
              <ExplosionCandidate form={form} pixelsPerUnit={pixelsPerUnit} />
              <CombatLine form={form} pixelsPerUnit={pixelsPerUnit} />
              {characters.map((_, idx) => (
                <CharMarker
                  key={idx}
                  idx={idx}
                  snap={snap}
                  pixelsPerUnit={pixelsPerUnit}
                  form={form}
                />
              ))}
            </svg>
          )}
        </DraggableProvider>
      </div>
    </>
  );
}
