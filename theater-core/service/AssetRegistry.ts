export class AssetRegistry {
    private avatars: string[] = [];

    setAvatars(avatars: string[]): void {
        this.avatars = avatars;
    }

    getAvatars(): string[] {
        return this.avatars;
    }
}