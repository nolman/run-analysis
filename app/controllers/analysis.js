import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';

export default class AnalysisController extends Controller {
  @tracked msPerPixel = 5000;
}
