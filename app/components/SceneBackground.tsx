interface SceneBackgroundProps {
  description: string;
}

export default function SceneBackground({ description }: SceneBackgroundProps) {
  return (
    <div className="absolute inset-0">
      {/* Scene visual background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900" />

      {/* Scene description overlay */}
      <div className="absolute top-4 left-4 right-4 p-4 rounded-lg bg-black bg-opacity-20 backdrop-blur-sm text-white text-lg">
        {description}
      </div>
    </div>
  );
} 