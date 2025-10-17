import api, { type ApiResponse } from './api';

export interface AboutArticle {
  ID: string;
  TitleTH: string;
  TitleEN: string;
  Date: string;
  ImageURL: string;
  ContentTH: string;
  ContentEN: string;
  CreatedAt: string;
  UpdatedAt: string;
  TypeId: number;
}

export const getAboutArticles = async (): Promise<ApiResponse<AboutArticle[]>> => {
  return await api.get<AboutArticle[]>('abouts');
};

export const updateAboutArticle = async (id: string, data: Partial<AboutArticle>) => {
  return await api.put(`abouts/${id}`, data);
};