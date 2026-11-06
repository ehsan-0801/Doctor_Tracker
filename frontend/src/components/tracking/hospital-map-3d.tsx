"use client";

import { Bounds, Html, OrbitControls, RoundedBox, Text } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import type { Group, Mesh } from "three";
import { STATUS_COLORS, STATUS_LABELS, type HospitalLocation, type LocationType, type PresenceView } from "@/types/tracking";

/** Room tint per type (Coral & Slate family; OTs/ICU stand out). */
const ROOM_COLORS: Record<LocationType, string> = {
  ot: "#e98975",
  icu: "#f5b6a3",
  emergency: "#f3a693",
  ward: "#ddf3f5",
  consultation: "#c9e6ec",
  lab: "#e6e1f2",
  radiology: "#d7e3ef",
  pharmacy: "#e1f0e4",
  reception: "#fff1e9",
  lounge: "#f1ebe3",
  office: "#e7ecee",
};

const UNIT = 1; // one grid unit = one scene unit

interface Placed {
  person: PresenceView;
  position: [number, number, number];
}

/** Lays occupants out in a small grid inside their room so figures never overlap. */
function placePeople(locations: HospitalLocation[], people: PresenceView[], center: { x: number; z: number }): Placed[] {
  const rooms = new Map(locations.map((l) => [l._id, l]));
  const groups = new Map<string, PresenceView[]>();
  for (const p of people) {
    if (!p.location || !rooms.has(p.location._id)) continue;
    const list = groups.get(p.location._id) ?? [];
    list.push(p);
    groups.set(p.location._id, list);
  }
  const placed: Placed[] = [];
  for (const [roomId, occupants] of groups) {
    const room = rooms.get(roomId)!;
    const cols = Math.max(1, Math.min(occupants.length, Math.floor(room.w / 1.6)));
    occupants
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((person, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const rows = Math.ceil(occupants.length / cols);
        const x = room.x + room.w / 2 + (col - (cols - 1) / 2) * 1.6 - center.x;
        const z = room.y + room.h / 2 + (row - (rows - 1) / 2) * 1.6 - center.z + 0.6;
        placed.push({ person, position: [x * UNIT, 0, z * UNIT] });
      });
  }
  return placed;
}

function Room({ room, center, occupied }: { room: HospitalLocation; center: { x: number; z: number }; occupied: boolean }) {
  const x = room.x + room.w / 2 - center.x;
  const z = room.y + room.h / 2 - center.z;
  const color = ROOM_COLORS[room.type];
  const wall = 0.55;
  return (
    <group position={[x, 0, z]}>
      <RoundedBox args={[room.w - 0.3, 0.18, room.h - 0.3]} radius={0.08} position={[0, 0.09, 0]} receiveShadow>
        <meshStandardMaterial color={color} roughness={0.85} />
      </RoundedBox>
      {/* Low walls on the four sides */}
      {[
        [0, (room.h - 0.3) / 2, room.w - 0.3, 0.12],
        [0, -(room.h - 0.3) / 2, room.w - 0.3, 0.12],
        [(room.w - 0.3) / 2, 0, 0.12, room.h - 0.3],
        [-(room.w - 0.3) / 2, 0, 0.12, room.h - 0.3],
      ].map(([wx, wz, ww, wd], i) => (
        <mesh key={i} position={[wx!, 0.18 + wall / 2, wz!]} castShadow>
          <boxGeometry args={[ww!, wall, wd!]} />
          <meshStandardMaterial color={occupied ? "#ffffff" : "#f4f6f6"} roughness={0.6} transparent opacity={0.92} />
        </mesh>
      ))}
      <Text position={[0, 0.2, -(room.h - 0.3) / 2 + 0.9]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.62} color="#253c48" anchorX="center" anchorY="middle" maxWidth={room.w - 1}>
        {room.name}
      </Text>
    </group>
  );
}

function Person({
  placed,
  selected,
  reducedMotion,
  onSelect,
}: {
  placed: Placed;
  selected: boolean;
  reducedMotion: boolean;
  onSelect: (userId: string) => void;
}) {
  const group = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { person, position } = placed;
  const color = STATUS_COLORS[person.status];

  // Glide towards the target position; pulse the ring for surgeries.
  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    if (reducedMotion) g.position.set(...position);
    else {
      const k = 1 - Math.exp(-delta * 4);
      g.position.x += (position[0] - g.position.x) * k;
      g.position.z += (position[2] - g.position.z) * k;
    }
    if (ring.current) {
      const pulse = reducedMotion || person.status !== "in_surgery" ? 1 : 1 + 0.25 * Math.sin(state.clock.elapsedTime * 4);
      ring.current.scale.setScalar(pulse);
    }
  });

  return (
    <group
      ref={group}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(person.userId);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
      }}
    >
      <mesh ref={ring} position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, selected ? 0.7 : 0.6, 32]} />
        <meshBasicMaterial color={selected ? "#253c48" : color} transparent opacity={0.85} />
      </mesh>
      {/* Body + head */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.55, 6, 16]} />
        <meshStandardMaterial color={person.role === "doctor" ? "#ffffff" : "#ddf3f5"} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.45, 0]} castShadow>
        <sphereGeometry args={[0.24, 24, 24]} />
        <meshStandardMaterial color="#f1c7a8" roughness={0.6} />
      </mesh>
      {/* Status badge above the head */}
      <mesh position={[0, 1.95, 0]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {(hovered || selected) && (
        <Html position={[0, 2.4, 0]} center distanceFactor={18} zIndexRange={[20, 0]}>
          <div className="pointer-events-none rounded-md border bg-card px-2.5 py-1.5 text-xs whitespace-nowrap text-card-foreground shadow-md">
            <p className="font-semibold">{person.name}</p>
            <p className="text-muted-foreground">
              {STATUS_LABELS[person.status]}
              {person.location ? ` · ${person.location.code}` : ""}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function HospitalMap3D({
  locations,
  people,
  selectedUserId,
  onSelect,
}: {
  locations: HospitalLocation[];
  people: PresenceView[];
  selectedUserId: string | null;
  onSelect: (userId: string | null) => void;
}) {
  const reducedMotion = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const bounds = useMemo(() => {
    const maxX = Math.max(20, ...locations.map((l) => l.x + l.w));
    const maxZ = Math.max(12, ...locations.map((l) => l.y + l.h));
    return { x: maxX / 2, z: maxZ / 2, span: Math.max(maxX, maxZ) };
  }, [locations]);
  const placed = useMemo(() => placePeople(locations, people, bounds), [locations, people, bounds]);
  const occupiedRooms = useMemo(() => new Set(people.flatMap((p) => (p.location ? [p.location._id] : []))), [people]);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, bounds.span * 0.75, bounds.span * 0.6], fov: 40 }}
      onPointerMissed={() => onSelect(null)}
      aria-label="3D hospital floor map"
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[18, 30, 12]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[bounds.x * 2 + 6, bounds.z * 2 + 6]} />
        <meshStandardMaterial color="#eef3f2" roughness={1} />
      </mesh>
      {/* Fit the camera to the floor on load and whenever the panel resizes. */}
      <Bounds fit clip observe margin={1.08}>
        {locations.map((room) => (
          <Room key={room._id} room={room} center={bounds} occupied={occupiedRooms.has(room._id)} />
        ))}
      </Bounds>
      {placed.map((p) => (
        <Person key={p.person.userId} placed={p} selected={p.person.userId === selectedUserId} reducedMotion={reducedMotion} onSelect={onSelect} />
      ))}
      <OrbitControls makeDefault enableDamping maxPolarAngle={Math.PI / 2.3} minDistance={8} maxDistance={bounds.span * 2.5} />
    </Canvas>
  );
}
