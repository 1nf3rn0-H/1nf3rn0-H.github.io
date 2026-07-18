# Article images

Store article images in this directory, preferably grouped by post slug. Import the image and the shared `ArticleImage` component in the corresponding `.mdx` file:

```mdx
import ArticleImage from '../../components/ArticleImage.astro';
import evaluationDiagram from '../../assets/logs/detection-quality/evaluation-flow.png';

<ArticleImage
  src={evaluationDiagram}
  alt="Detection evaluation data flowing into a qualitative quality tag"
  caption="A daily evaluation job combines operational and analyst feedback."
  credit="Harsh Mehta"
/>
```

`alt` is required. The component automatically produces responsive, optimized image variants and supports optional captions and source credits.
