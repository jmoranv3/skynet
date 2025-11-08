import { getKpiProgramadas, getKpiCompletadas, getKpiPendientes } from "./apiService";

export const getVisitasProgramadas = async () => {
  return getKpiProgramadas();
};

export const getVisitasCompletadas = async () => {
  return getKpiCompletadas();
};



export const getVisitasPendientes = async () => {
  return getKpiPendientes();
};


