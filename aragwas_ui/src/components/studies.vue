<template>
<div class="mt-3">
  <h4>
    Studies
  </h4>
   <table>
    <thead>
      <tr>
        <th v-for="key in columns"
          @click="sortBy(key)"
          :class="{ active: sortKey == key }">
          {{ key | capitalize }}
          <span class="arrow" :class="sortOrders[key] > 0 ? 'asc' : 'dsc'">
          </span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="entry in filteredData">
        <td v-for="key in columns">
          {{entry[key]}}
        </td>
      </tr>
    </tbody>
  </table>
  <div class="page-container mt-5">
    <v-pagination :length.number="pageCount" v-model="currentPage" />
  </div>
</div>
</template>


<script lang="ts">
  import Vue from 'vue'
  import Component from 'vue-class-component'
  import Study from '@/models/study'
  import Page from '@/models/page'
  import {loadStudies} from '@/api'

  @Component({
    filters: {
      capitalize (str) {
        return str.charAt(0).toUpperCase() + str.slice(1)
      }
    }
  })
  export default class Studies extends Vue {
    loading: boolean = false
    studyPage: Page<Study>
    sortOrders = {'name': 1, 'transformation': 1, 'method': 1}
    sortKey: string = ''
    columns = ['name', 'transformation', 'method']
    filterKey: string = ''
    studies = []
    currentPage = 1
    pageCount = 5
    pageSize = 25
    totalCount = 0

    get filteredData () {
      let sortKey = this.sortKey
      let filterKey = this.filterKey
      if (filterKey) {
        filterKey = filterKey.toLowerCase()
      }
      let order = this.sortOrders[sortKey] || 1
      let data = this.studies
      if (filterKey) {
        data = data.filter(function (row) {
          return Object.keys(row).some(function (key) {
            return String(row[key]).toLowerCase().indexOf(filterKey) > -1
          })
        })
      }
      if (sortKey) {
        data = data.slice().sort(function (item1, item2) {
          let a = item1[sortKey]
          let b = item2[sortKey]
          return (a === b ? 0 : a > b ? 1 : -1) * order
        })
      }
      return data
    }

    created (): void {
      loadStudies().then(this._displayData)
    }
    _displayData (data) : void {
      this.studies = data['items']
      this.pageSize = data['pageSize']
      this.currentPage = data['pageIndex']
      this.totalCount = data['totalCount']
      this.pageCount = data['pageCount']
    }
    sortBy (key) : void {
      this.sortKey = key
      this.sortOrders[key] = this.sortOrders[key] * -1
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.arrow {
  display: inline-block;
  vertical-align: middle;
  width: 0;
  height: 0;
  margin-left: 5px;
  opacity: 0;
}

.arrow.asc {
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 4px solid green;
}

.arrow.dsc {
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid green;
}

th.active {
  color:black;
}

th.active .arrow {
  opacity: 1;
}
.page-container {
  display:flex;
  justify-content:center;

}
</style>