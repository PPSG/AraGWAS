import ApiVersion from "../models/apiversion";
import Gene from "../models/gene";
import Page from "../models/page";
import Study from "../models/study";

// TODO convert to Typescript
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const error = new Error(response.statusText);
    throw error;
  }
}

// TODO convert to Typescript
function convertToModel<T>(response): T {
    return response.json();
}
// Study list
export async function loadStudies(page: number = 1, ordering = "") {
    return fetch(`/api/studies/?page=${page}&ordering=${ordering}`)
        .then(checkStatus)
        .then(convertToModel);
}

// Import single study information
export async  function loadStudy(studyId: number) {
    return fetch(`/api/studies/${studyId}`)
        .then(checkStatus)
        .then(convertToModel);
}
export async  function loadAssociationsOfStudy(studyId: number, page= 1) {
    return fetch(`/api/studies/${studyId}/associations/?page=${page}`)
        .then(checkStatus)
        .then(convertToModel);
}
// Load associations for manhattan plots
export async  function loadAssociationsForManhattan(studyId: number) {
    return fetch(`/api/studies/${studyId}/gwas/?filter=2500&filter_type=top`)
        .then(checkStatus)
        .then(convertToModel);
}

// Phenotype list
export async  function loadPhenotypes(page: number = 1, ordering= "") {
    return fetch(`/api/phenotypes/?page=${page}&ordering=${ordering}`)
        .then(checkStatus)
        .then(convertToModel);
}

// Import single phenotype information
export async  function loadPhenotype(phenotypeId: number) {
    return fetch(`/api/phenotypes/${phenotypeId}`)
        .then(checkStatus)
        .then(convertToModel);
}
export async  function loadAssociationsOfPhenotype(phenotypeId: number, page: number= 1) {
    return fetch(`/api/phenotypes/${phenotypeId}/associations/?page=${page}`)
        .then(checkStatus)
        .then(convertToModel);
}
// Load similar phenotypes based on ontology
export async function loadSimilarPhenotypes(phenotypeId: number) {
    return fetch(`/api/phenotypes/${phenotypeId}/similar/`)
        .then(checkStatus)
        .then(convertToModel);
}

// Gene list
export async  function loadGenes(page: number = 1, ordering= "") {
    return fetch(`/api/genes/?page=${page}&ordering=${ordering}`)
        .then(checkStatus)
        .then(convertToModel);
}

// Import single gene information
export async function loadGene(geneId = ""): Promise<Gene> {
    return fetch(`/api/genes/${geneId}`)
        .then(checkStatus)
        .then(convertToModel);
}
export async  function loadAssociationsOfGene(geneId= "1", page: number = 1, ordering= "-pvalue") {
    return fetch(`/api/genes/${geneId}/associations/?page=${page}&ordering=${ordering}`)
        .then(checkStatus)
        .then(convertToModel);
}

export async function loadTopAssociations(filter) {
    return fetch(`/api/associations/?chr=${filter["chr"]}&maf=${filter["maf"]}&anno=${filter["annotation"]}&type=${filter["type"]}&page=${filter["page"]}`)
        .then(checkStatus)
        .then(convertToModel);
}
export async  function loadTopGenes() {
    return fetch(`/api/genes/top/`)
        .then(checkStatus)
        .then(convertToModel);
}
export async function loadAssociationCount() {
    return fetch(`/api/associations/count/`)
        .then(checkStatus)
        .then(convertToModel);
}

export async function search(queryTerm= "", page: number = 1, ordering= "") {
    if (queryTerm === "") {
        return fetch(`/api/search/search_results/?page=${page}&ordering=${ordering}`)
            .then(checkStatus)
            .then(convertToModel);
    } else {
        return fetch(`/api/search/search_results/${queryTerm}/?page=${page}&ordering=${ordering}`)
            .then(checkStatus)
            .then(convertToModel);
    }
}

export async function autoCompleteGenes(queryTerm: string): Promise<Gene[]> {
    return fetch(`/api/genes/autocomplete/?term=${queryTerm}`)
        .then(checkStatus)
        .then(convertToModel);
}

export async  function loadApiVersion(): Promise<ApiVersion> {
    return fetch("/api/version/")
        .then(checkStatus)
        .then(convertToModel);
}
