interface SceneBackgroundProps {
  description: string;
}

export default function SceneBackground({ description }: SceneBackgroundProps) {
  return (
    <div className="absolute inset-0">
      {/* Scene visual background */}
      <div className="absolute inset-0" />

      {/* Scene description overlay */}
      <div className="absolute top-4 left-10 right-10 p-4 rounded-lg text-white text-lg">
        {description}
      </div>
    </div>
  );
}
