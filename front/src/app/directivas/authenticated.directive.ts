import { Directive, OnDestroy, TemplateRef, ViewContainerRef } from "@angular/core";
import { Subscription } from "rxjs";
import { RoleService } from "../services/role.service";


@Directive({
  selector: '[appAuthenticated]',
})
export class AuthenticatedDirective implements OnDestroy {
  private subscription: Subscription = new Subscription();
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private roleService: RoleService
  ) {
    this.subscription = this.roleService
      .isLoggedIn()
      .subscribe((isLoggedIn) => {
        if (isLoggedIn && !this.hasView) {
          this.viewContainer.createEmbeddedView(this.templateRef);
          this.hasView = true;
        } else if (!isLoggedIn && this.hasView) {
          this.viewContainer.clear();
          this.hasView = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
