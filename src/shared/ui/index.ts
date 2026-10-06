import type { SharedUi } from '../contract';
import {
  Avatar, Badge, Banner, DataState, Field, PageHeader, Pager, SectionHeading, SelectField, StatCard, TextField,
} from './components';
import { useDebounced, useLoad, useSubmit } from './hooks';

/** The kit handed to every portal. Defined once here, never copied into a portal. */
export const sharedUi: SharedUi = {
  DataState,
  Field,
  TextField,
  SelectField,
  PageHeader,
  Pager,
  Banner,
  Badge,
  Avatar,
  StatCard,
  SectionHeading,
  useDebounced,
  useLoad,
  useSubmit,
};
