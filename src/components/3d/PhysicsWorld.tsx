import { ReactNode } from 'react';
import { Physics } from '@react-three/rapier';

interface PhysicsWorldProps {
  children: ReactNode;
}

export default function PhysicsWorld({ children }: PhysicsWorldProps) {
  return (
    <Physics
      gravity={[0, -9.81, 0]}
      timeStep="vary"
      paused={false}
      debug={false}
    >
      {children}
    </Physics>
  );
}
