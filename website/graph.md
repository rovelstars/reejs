---
title: "Performance Benchmark Graph"
---

# Performance Benchmark Graph

We have a benchmark graph for the performance of Reejs, Vite & Nextjs. Benchmarking is ran on github actions.

  <div class="container">
    <Bar v-if="loaded" :data="chartData" />
  </div>
  
<script>
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

export default {
name: 'BarChart',
components: { Bar },
data: () => ({
loaded: false,
chartData: null
}),
async mounted () {
this.loaded = false

    try {
      const reejs = await fetch('https://rovelstars.github.io/reejs/benchmarks.json')
      const vite = await fetch('https://renhiyama.github.io/vite-benchmark/benchmarks.json')
      const nextjs = await fetch('https://renhiyama.github.io/nextjs-benchmark/benchmarks.json')

      function parseData(data,field){
        let {results} = data[0];
        return results.find((result) => result.name === field)?.mean;
      }

      const reejsData = await reejs.json()
      const viteData = await vite.json()
      const nextjsData = await nextjs.json()

      this.chartData = {
        labels: ['Reejs', 'Vite', 'Nextjs'],
        datasets: [
          {
            label: 'Install dependencies (s)',
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
            data: [
              parseData(reejsData,'Install dependencies'),
              parseData(viteData,'Install dependencies'),
              parseData(nextjsData,'Install dependencies')
            ]
          },
          {
            label: 'Build [Dev Mode] (s)',
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
            data: [
              parseData(reejsData,'Packit - Node [DEV]'),
              parseData(viteData,'Vite - Node [DEV]'),
              parseData(nextjsData,'Nextjs - Node [DEV]')
            ]
          },
          {
            label: 'Build [Prod Mode] (s)',
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
            data: [
              parseData(reejsData,'Packit - Node [PROD]'),
              parseData(viteData,'Vite - Node [PROD]'),
              parseData(nextjsData,'Nextjs - Node [PROD]')
            ]
          }
        ]
      }
      this.reejsInstallCacWVite = (parseData(viteData,'Install dependencies') / parseData(reejsData,'Install dependencies')).toFixed(2)
      this.reejsInstallCacWNextjs = (parseData(nextjsData,'Install dependencies') / parseData(reejsData,'Install dependencies')).toFixed(2)
      this.reejsDevCacWVite = (parseData(viteData,'Vite - Node [DEV]') / parseData(reejsData,'Packit - Node [DEV]')).toFixed(2)
      this.reejsDevCacWNextjs = (parseData(nextjsData,'Nextjs - Node [DEV]') / parseData(reejsData,'Packit - Node [DEV]')).toFixed(2)
      this.reejsProdCacWVite = (parseData(viteData,'Vite - Node [PROD]') / parseData(reejsData,'Packit - Node [PROD]')).toFixed(2)
      this.reejsProdCacWNextjs = (parseData(nextjsData,'Nextjs - Node [PROD]') / parseData(reejsData,'Packit - Node [PROD]')).toFixed(2)
      
      this.loaded = true
    } catch (e) {
      console.error(e)
    }

}
}
</script>

<!-- show the conclusion generated -->

## Conclusion

- Reejs is {{reejsInstallCacWVite}}x faster than Vite and {{reejsInstallCacWNextjs}}x faster than Nextjs in installing dependencies.
- Reejs is {{reejsDevCacWVite}}x faster than Vite and {{reejsDevCacWNextjs}}x faster than Nextjs in building in development mode.
- Reejs is {{reejsProdCacWVite}}x faster than Vite and {{reejsProdCacWNextjs}}x faster than Nextjs in building in production mode.

You can read the raw data here:

- [Reejs](https://rovelstars.github.io/reejs/benchmarks.json) - [Github](https://github.com/rovelstars/reejs)
- [Vite](https://renhiyama.github.io/vite-benchmark/benchmarks.json) - [Github](https://github.com/renhiyama/vite-benchmark)
- [Nextjs](https://renhiyama.github.io/nextjs-benchmark/benchmarks.json) - [Github](https://github.com/renhiyama/nextjs-benchmark)
