interface SceneBackgroundProps {
  description: string;
}

export default function SceneBackground({ description }: SceneBackgroundProps) {
  return (
    <div className="absolute inset-0">
      {/* Scene visual background */}
      <div className="absolute inset-0" />

      {/* Scene description overlay */}
      <div className="absolute top-4 left-20 right-20 p-4 text-white/70 text-lg text-center">
        {description}
      </div>
    </div>
  );
}
