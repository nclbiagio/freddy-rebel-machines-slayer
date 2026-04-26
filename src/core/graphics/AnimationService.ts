export class AnimationService {
   private static _instance: AnimationService;
   #animations: string[] = [];
   constructor() {}

   static getInstance(): AnimationService {
      if (this._instance) {
         return this._instance;
      }

      this._instance = new AnimationService();
      return this._instance;
   }

   addAnimation(animation: string) {
      if (!this.#animations.includes(animation)) {
         this.#animations.push(animation);
      }
   }

   animationIsAdded(key: string) {
      return this.#animations.includes(key);
   }

   resetAnimations() {
      this.#animations = [];
   }
}
