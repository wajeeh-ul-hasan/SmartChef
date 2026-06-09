# Recipe Photos and Test Recipes

SmartChef now has real starter recipes inside `app.js`.

## How Photos Work
Each recipe has a `photo` field. Example:

```js
"Egg Fried Rice": {
  photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Egg_fried_rice.jpg",
  credit: "Photo: ProjectManhattan / Wikimedia Commons / CC BY-SA 3.0",
  creditUrl: "https://commons.wikimedia.org/wiki/File:Egg_fried_rice.jpg"
}
```

The recipe card uses this photo in front of the recipe name. The recipe detail screen uses the same photo larger at the top.

## How To Replace A Photo
1. Find a photo you are allowed to use.
2. Copy the direct image URL.
3. Replace the `photo` value for that recipe in `app.js`.
4. Update the `credit` and `creditUrl`.
5. Commit and push.

## Best Photo Sources For Early Testing
- Wikimedia Commons.
- Unsplash.
- Pexels.
- Your own food photos.

For a real public app, your own photos or properly licensed stock photos are best.

## How To Add A New Recipe
Add it in two places in `app.js`:

1. Add the short card data under `recipes.quick`, `recipes.desi`, or `recipes.creative`.
2. Add full details under `recipeDetails`, including:
   - `photo`
   - `credit`
   - `ingredients`
   - `instructions`
   - `nutrition`
   - `equipment`

After that, SmartChef can show it as a card and open it as a full recipe.
